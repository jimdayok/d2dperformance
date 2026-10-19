begin;
alter table public.social_review_posts add column lock_version integer not null default 1;
alter table public.social_review_activity alter column actor_id drop not null;
alter table public.social_review_activity add column actor_kind text not null default 'staff';
create table public.social_review_links(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),
 token_hash text not null unique,post_ids uuid[] not null,expires_at timestamptz not null,revoked_at timestamptz,
 created_by uuid references auth.users(id),created_at timestamptz not null default now()
);
create table public.social_review_email_settings(
 organization_id uuid primary key references public.organizations(id),
 sender text not null default 'D2D Marketing <socialpages@d2dmktg.com>',
 staff_recipients text[] not null default array['jim@d2dmktg.com','andrea@d2dmktg.com'],
 client_recipients text[] not null default '{}',updated_at timestamptz not null default now()
);
create table public.social_review_outbox(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),post_id uuid references public.social_review_posts(id),
 activity_id uuid unique references public.social_review_activity(id),event text not null,
 staff_recipients text[] not null,client_recipients text[] not null,sender text not null,
 payload jsonb not null,status text not null default 'preview_only' check(status='preview_only'),created_at timestamptz not null default now()
);
alter table public.social_review_links enable row level security;
alter table public.social_review_email_settings enable row level security;
alter table public.social_review_outbox enable row level security;
grant all on public.social_review_links,public.social_review_email_settings,public.social_review_outbox to service_role;

-- All writes enter through a scoped authenticated or invitation wrapper.
create function public.apply_social_review_v2(check_post uuid,check_revision integer,check_version integer,check_action text,check_body text,check_patch jsonb,actor uuid,actor_label text,actor_kind text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare p public.social_review_posts; dest text; detail text; date_value timestamptz; new_content jsonb;
begin
 select * into p from public.social_review_posts where id=check_post for update;
 if p.id is null then raise exception 'Post not found'; end if;
 if check_action not in ('comment','edit','submit','request_changes','approve','schedule','reopen','move','plan','reschedule','invite','publication_preview','unschedule') then raise exception 'Unknown action'; end if;
 if length(check_body)>6000 then raise exception 'Message is too long'; end if;
 if check_action<>'comment' and (p.revision<>check_revision or (check_version is not null and p.lock_version<>check_version)) then raise exception 'This post changed. Refresh and review the latest version.'; end if;
 if check_action in ('approve','schedule','reschedule','publication_preview','invite','unschedule') and not p.is_test then raise exception 'Real post approvals, public review links and delivery are blocked in private staging'; end if;
 if check_action in ('edit','submit','request_changes') and p.status='scheduled' then raise exception 'Return this scheduled test post to a draft first'; end if;
 if check_action='comment' and length(trim(check_body))=0 then raise exception 'Write a comment first'; end if;
 if check_action='request_changes' and (length(trim(check_body))=0) then raise exception 'Explain the changes needed on this review'; end if;
 if check_action='approve' and p.status<>'pending' then raise exception 'Submit this post for review first'; end if;
 if check_action='submit' and p.status not in ('idea','in_progress','changes_requested') then raise exception 'This post is already in review or approved'; end if;
 if check_action='submit' and (coalesce(p.content->'captions','{}'::jsonb)='{}'::jsonb or (coalesce(jsonb_array_length(p.content->'mediaIds'),0)=0 and coalesce(p.content->>'sampleImage','')='')) then raise exception 'Add a caption and finished media before review'; end if;
 if check_action in ('schedule','reschedule','plan') then
  date_value=coalesce((check_patch->>'planned_for')::timestamptz,p.planned_for);
  if date_value is null or date_value<=now() then raise exception 'Choose a future date and Central time'; end if;
  if check_action='schedule' and (p.status<>'approved' or p.approved_revision is distinct from p.revision) then raise exception 'Approve the current version of this post first'; end if;
  if check_action='reschedule' and (p.status<>'scheduled' or p.approved_revision is distinct from p.revision) then raise exception 'Only an unchanged scheduled test post can be rescheduled'; end if;
  if check_action='plan' and p.status='scheduled' then raise exception 'Use reschedule for this scheduled test post'; end if;
 end if;
 if check_action='edit' then
  if coalesce(length(trim(check_patch->>'title')),0) not between 1 and 180 or jsonb_typeof(check_patch->'captions') is distinct from 'object' then raise exception 'Enter a title and platform captions'; end if;
  if check_patch->>'contentType'='campaign' and coalesce(length(trim(check_patch->>'campaign')),0)=0 then raise exception 'Enter the campaign name'; end if;
  if coalesce(length(check_patch->>'campaign'),0)>120 or coalesce(length(check_patch->>'productFocus'),0)>180 then raise exception 'Campaign details are too long'; end if;
  new_content=p.content || jsonb_build_object('captions',check_patch->'captions','brief',coalesce(check_patch->>'brief',''),'tags',coalesce(check_patch->'tags','[]'::jsonb),'campaign',coalesce(check_patch->>'campaign',''),'contentType',coalesce(check_patch->>'contentType','evergreen'),'productFocus',coalesce(check_patch->>'productFocus',''));
  if check_patch ? 'mediaIds' then
   if jsonb_typeof(check_patch->'mediaIds')<>'array' or jsonb_array_length(check_patch->'mediaIds')>12 then raise exception 'Choose valid creative'; end if;
   if exists(select 1 from jsonb_array_elements_text(check_patch->'mediaIds') selected(id) where not exists(select 1 from public.social_studio_media m where m.id=selected.id::uuid and m.organization_id=p.organization_id)) then raise exception 'Choose creative from this client library'; end if;
   new_content=new_content || jsonb_build_object('mediaIds',check_patch->'mediaIds','sampleImage',null,'sampleImages','[]'::jsonb);
  end if;
  update public.social_review_posts set title=trim(check_patch->>'title'),content=new_content,revision=revision+1,approved_revision=null,status=case when status in ('idea','in_progress') then 'in_progress' else 'changes_requested' end,updated_at=now(),lock_version=lock_version+1 where id=p.id;
 elsif check_action in ('schedule','reschedule','plan') then
  update public.social_review_posts set planned_for=date_value,status=case when check_action='plan' then status else 'scheduled' end,lock_version=lock_version+1,updated_at=now() where id=p.id;
 elsif check_action='unschedule' then
  dest=check_patch->>'target_status';
  if p.status<>'scheduled' or dest not in ('approved','pending','changes_requested') or dest is null then raise exception 'Choose a valid return status for this test schedule'; end if;
  if dest='changes_requested' and length(trim(check_body))=0 then raise exception 'Explain the requested changes'; end if;
  update public.social_review_posts set status=dest,approved_revision=case when dest='approved' then approved_revision else null end,lock_version=lock_version+1,updated_at=now() where id=p.id;
 elsif check_action='move' then
  dest=check_patch->>'target_status';
  if dest not in ('idea','in_progress') or dest is null then raise exception 'Use the review or scheduling prompt for this column'; end if;
  if p.status='scheduled' and not p.is_test then raise exception 'Real schedules cannot be changed in private staging'; end if;
  update public.social_review_posts set status=dest,approved_revision=null,revision=revision+1,lock_version=lock_version+1,updated_at=now() where id=p.id;
 elsif check_action not in ('comment','invite','publication_preview') then
  dest=case check_action when 'submit' then 'pending' when 'request_changes' then 'changes_requested' when 'approve' then 'approved' when 'reopen' then 'in_progress' end;
  update public.social_review_posts set status=dest,approved_revision=case when check_action='approve' then revision when check_action in ('request_changes','reopen') then null else approved_revision end,revision=case when check_action='reopen' then revision+1 else revision end,lock_version=lock_version+1,updated_at=now() where id=p.id;
 end if;
 detail=case check_action
 when 'schedule' then 'Scheduled this test post for '||date_value::text||'. No social network was contacted.'
 when 'reschedule' then 'Changed only this test schedule to '||date_value::text||'. Content approval remains valid.'
 when 'plan' then 'Planned this post for '||date_value::text||'. This does not approve or publish it.'
 when 'approve' then 'Approved this test post, revision '||p.revision||'. Other posts are unchanged.'
 when 'submit' then 'Submitted this post for client review.'
 when 'edit' then 'Saved a new content revision. Previous approval is cleared.'
 when 'reopen' then 'Returned this post to a draft; previous approval cleared.'
 when 'unschedule' then 'Removed the test schedule and moved this post to '||replace(dest,'_',' ')||'. '||check_body
 when 'move' then 'Moved this post to '||replace(dest,'_',' ')||'. Previous approval cleared.'
 when 'invite' then 'Prepared a private client approval invitation.'
 when 'publication_preview' then 'Sample publication confirmation only. A real confirmation requires verified platform delivery.'
 else check_body end;
 insert into public.social_review_activity(post_id,organization_id,actor_id,actor_name,actor_kind,kind,body) values(p.id,p.organization_id,actor,actor_label,actor_kind,check_action,detail);
 return jsonb_build_object('id',p.id,'action',check_action);
end $$;
revoke all on function public.apply_social_review_v2(uuid,integer,integer,text,text,jsonb,uuid,text,text) from public,anon,authenticated;
grant execute on function public.apply_social_review_v2(uuid,integer,integer,text,text,jsonb,uuid,text,text) to service_role;

drop function public.transition_social_review(uuid,integer,text,text,jsonb);
create function public.transition_social_review(check_post uuid,check_revision integer,check_action text,check_body text default '',check_patch jsonb default '{}'::jsonb,check_version integer default null)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare p public.social_review_posts; label text; kind text;
begin
 select * into p from public.social_review_posts where id=check_post;
 if not public.has_product_role(p.organization_id,'social',array['manager','creator','reviewer'],auth.uid()) then raise exception 'Not authorized' using errcode='42501'; end if;
 if check_action in ('approve','schedule','reschedule','request_changes','unschedule') and not public.has_product_role(p.organization_id,'social',array['manager','reviewer'],auth.uid()) then raise exception 'Reviewer access required' using errcode='42501'; end if;
 if check_action in ('edit','submit','move','plan','reopen','invite','publication_preview') and not public.has_product_role(p.organization_id,'social',array['manager','creator'],auth.uid()) then raise exception 'Creator access required' using errcode='42501'; end if;
 select coalesce(raw_user_meta_data->>'display_name','Team member') into label from auth.users where id=auth.uid();
 kind=case when public.has_product_role(p.organization_id,'social',array['manager','creator'],auth.uid()) then 'staff' else 'client' end;
 return public.apply_social_review_v2(check_post,check_revision,check_version,check_action,check_body,check_patch,auth.uid(),coalesce(label,'Team member'),kind);
end $$;
revoke all on function public.transition_social_review(uuid,integer,text,text,jsonb,integer) from public,anon;
grant execute on function public.transition_social_review(uuid,integer,text,text,jsonb,integer) to authenticated;

create function public.client_social_review(check_hash text,check_post uuid,check_revision integer,check_version integer,check_action text,check_body text default '',check_patch jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare invitation public.social_review_links; p public.social_review_posts;
begin
 select * into invitation from public.social_review_links where token_hash=check_hash for share;
 if invitation.id is null or invitation.revoked_at is not null or invitation.expires_at<=now() or not check_post=any(invitation.post_ids) then raise exception 'This review link has expired or is unavailable'; end if;
 select * into p from public.social_review_posts where id=check_post and organization_id=invitation.organization_id and is_test=true;
 if p.id is null then raise exception 'This post was not shared in this review'; end if;
 if check_action not in ('edit','comment','submit','request_changes','approve') then raise exception 'This action requires the D2D team'; end if;
 return public.apply_social_review_v2(check_post,check_revision,check_version,check_action,check_body,check_patch,null,'Invited client (review link)','client');
end $$;
revoke all on function public.client_social_review(text,uuid,integer,integer,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.client_social_review(text,uuid,integer,integer,text,text,jsonb) to service_role;

create function public.queue_social_review_email() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare p public.social_review_posts; settings public.social_review_email_settings; event_name text; path text; token text; org_name text;
begin
 select * into p from public.social_review_posts where id=new.post_id;
 select * into settings from public.social_review_email_settings where organization_id=new.organization_id;
 if settings.organization_id is null then
  insert into public.social_review_email_settings(organization_id) values(new.organization_id) on conflict do nothing;
  select * into settings from public.social_review_email_settings where organization_id=new.organization_id;
 end if;
 select name into org_name from public.organizations where id=new.organization_id;
 event_name=case when new.kind in ('submit','invite') then 'approval_requested' when new.kind='comment' then 'feedback' when new.kind='approve' then 'approved' when new.kind='schedule' then 'scheduled' when new.kind='publication_preview' then 'publication_preview' else 'post_changed' end;
 path='/portal/marketing?organization='||new.organization_id::text;
 if event_name='approval_requested' and p.is_test then
  token=replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','');
  insert into public.social_review_links(organization_id,token_hash,post_ids,expires_at,created_by) values(new.organization_id,encode(sha256(convert_to(token,'utf8')),'hex'),array[p.id],now()+interval '48 hours',new.actor_id);
  path='/review/social/'||token;
 end if;
 insert into public.social_review_outbox(organization_id,post_id,activity_id,event,staff_recipients,client_recipients,sender,payload)
 values(new.organization_id,p.id,new.id,event_name,settings.staff_recipients,
 case when event_name in ('approval_requested','publication_preview') or new.actor_kind='staff' then settings.client_recipients else '{}'::text[] end,
 settings.sender,jsonb_build_object('title',p.title,'organization',org_name,'body',new.body,'review_path',path,'campaign',coalesce(p.content->>'campaign',''),'planned_for',p.planned_for,'actor_kind',new.actor_kind));
 return new;
end $$;
create trigger social_review_activity_email after insert on public.social_review_activity for each row execute function public.queue_social_review_email();
create function public.queue_social_note_email() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare settings public.social_review_email_settings; org_name text;
begin
 select * into settings from public.social_review_email_settings where organization_id=new.organization_id;
 if settings.organization_id is null then insert into public.social_review_email_settings(organization_id) values(new.organization_id) on conflict do nothing;select * into settings from public.social_review_email_settings where organization_id=new.organization_id;end if;
 select name into org_name from public.organizations where id=new.organization_id;
 insert into public.social_review_outbox(organization_id,event,staff_recipients,client_recipients,sender,payload)
 values(new.organization_id,'note',settings.staff_recipients,settings.client_recipients,settings.sender,jsonb_build_object('title','Project note','organization',org_name,'body',new.body,'review_path','/portal/marketing?organization='||new.organization_id::text));
 return new;
end $$;
create trigger social_review_note_email after insert on public.social_review_notes for each row execute function public.queue_social_note_email();
commit;
