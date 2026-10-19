begin;
alter table public.social_review_posts
 add column source_legacy_item_id uuid unique references public.social_content_items(id) on delete restrict,
 add column legacy_batch_status text,
 add column legacy_provider_post_id text;
create table public.social_review_legacy_snapshots(
 item_id uuid primary key references public.social_content_items(id) on delete restrict,
 organization_id uuid not null references public.organizations(id),
 item_snapshot jsonb not null,batch_snapshot jsonb not null,imported_at timestamptz not null default now()
);
alter table public.social_review_legacy_snapshots enable row level security;
revoke all on public.social_review_legacy_snapshots from public,anon,authenticated;
grant all on public.social_review_legacy_snapshots to service_role;

-- The old item remains an immutable source record; the new row is the review workspace representation.
-- No publishing adapter, approval transition, activity trigger or email queue is called by this function.
create function public.import_legacy_social_reviews(check_organization uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare added integer; total integer;
begin
 if check_organization is null then raise exception 'Choose one organization';end if;
 lock table public.social_content_batches,public.social_content_items in share mode;
 if exists(select 1 from public.social_content_items i join public.social_content_batches b on b.id=i.batch_id where b.organization_id=check_organization and b.status in ('published','archived')) then raise exception 'Published or archived campaigns require an explicit history mapping';end if;
 if exists(select 1 from public.social_content_items i join public.social_content_batches b on b.id=i.batch_id where b.organization_id=check_organization and b.status in ('scheduled','scheduling') and i.approved_revision is distinct from i.current_revision) then raise exception 'A scheduled legacy post has an inconsistent approval; reconcile it before import';end if;
 if exists(select 1 from public.social_content_items i join public.social_content_batches b on b.id=i.batch_id join public.social_review_posts r on r.id=i.id where b.organization_id=check_organization and r.source_legacy_item_id is distinct from i.id) then raise exception 'An existing review identity conflicts with a legacy post';end if;
 insert into public.social_review_legacy_snapshots(item_id,organization_id,item_snapshot,batch_snapshot)
 select i.id,b.organization_id,to_jsonb(i),to_jsonb(b) from public.social_content_items i join public.social_content_batches b on b.id=i.batch_id where b.organization_id=check_organization on conflict(item_id) do nothing;
 insert into public.social_review_posts(id,organization_id,source_legacy_item_id,title,project,status,revision,approved_revision,planned_for,is_test,content,created_by,created_at,updated_at,legacy_batch_status,legacy_provider_post_id)
 select i.id,b.organization_id,i.id,left(b.title||' · Day '||i.content_day||' · '||initcap(i.platform),180),b.title,
 case when b.status in ('scheduled','scheduling') then 'scheduled' when i.approved_revision=i.current_revision then 'approved' when b.status='client_review' then 'pending' when b.status='changes_requested' then 'changes_requested' else 'in_progress' end,
 i.current_revision,i.approved_revision,i.scheduled_for,false,
 jsonb_build_object('captions',jsonb_build_object(i.platform,i.caption),'mediaIds','[]'::jsonb,'legacyMedia',i.media,'kind',case when jsonb_array_length(i.media)>1 then 'carousel' when exists(select 1 from jsonb_array_elements(i.media) m where coalesce(m->>'type','') like 'video%' or coalesce(m->>'url','') ~* '\.(mp4|webm|mov)([?#]|$)') then 'video' else 'graphic' end,'brief',i.creative_brief,'tags','[]'::jsonb,'campaign',left(b.title,120),'contentType','campaign','productFocus',''),
 i.created_by,i.created_at,i.updated_at,b.status,i.shoutrrr_post_id
 from public.social_content_items i join public.social_content_batches b on b.id=i.batch_id where b.organization_id=check_organization
 on conflict(source_legacy_item_id) do nothing;
 get diagnostics added=row_count;
 select count(*) into total from public.social_content_items i join public.social_content_batches b on b.id=i.batch_id where b.organization_id=check_organization;
 return jsonb_build_object('added',added,'already_linked',total-added,'source_count',total,'linked_count',(select count(*) from public.social_review_posts where organization_id=check_organization and source_legacy_item_id is not null));
end $$;
revoke all on function public.import_legacy_social_reviews(uuid) from public,anon,authenticated;
grant execute on function public.import_legacy_social_reviews(uuid) to service_role;

create function public.guard_imported_social_review() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if old.source_legacy_item_id is not null then
  if row(new.source_legacy_item_id,new.organization_id,new.legacy_batch_status,new.legacy_provider_post_id) is distinct from row(old.source_legacy_item_id,old.organization_id,old.legacy_batch_status,old.legacy_provider_post_id) then raise exception 'The original publishing identity must be preserved';end if;
  if old.legacy_batch_status in ('scheduled','scheduling','published') and row(new.content,new.revision,new.approved_revision,new.planned_for,new.status,new.title) is distinct from row(old.content,old.revision,old.approved_revision,old.planned_for,old.status,old.title) then raise exception 'This existing publishing schedule is preserved. Manage its live delivery in D2D Social before changing it here.';end if;
 end if;
 return new;
end $$;
revoke all on function public.guard_imported_social_review() from public,anon,authenticated;
create trigger preserve_imported_delivery before update on public.social_review_posts for each row execute function public.guard_imported_social_review();

-- Prevent the previous batch workflow from re-approving or publishing an item now managed individually.
create function public.guard_handed_off_social_item() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if exists(select 1 from public.social_review_posts where source_legacy_item_id=old.id) and row(new.caption,new.media,new.scheduled_for,new.current_revision,new.approved_revision,new.creative_brief,new.required_assets) is distinct from row(old.caption,old.media,old.scheduled_for,old.current_revision,old.approved_revision,old.creative_brief,old.required_assets) then raise exception 'This post is now managed in the new social board. Open the new workspace to review or edit it.';end if;
 return new;
end $$;
revoke all on function public.guard_handed_off_social_item() from public,anon,authenticated;
create trigger handed_off_review_item before update on public.social_content_items for each row execute function public.guard_handed_off_social_item();
create function public.guard_handed_off_social_batch() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if exists(select 1 from public.social_review_posts r join public.social_content_items i on i.id=r.source_legacy_item_id where i.batch_id=old.id) and (new.approval_version is distinct from old.approval_version or new.approved_approval_version is distinct from old.approved_approval_version or (new.status is distinct from old.status and new.status in ('approved','scheduling','scheduled'))) then raise exception 'These posts are now managed individually in the new social board. Previous campaigns cannot start another publishing job.';end if;
 return new;
end $$;
revoke all on function public.guard_handed_off_social_batch() from public,anon,authenticated;
create trigger handed_off_review_batch before update on public.social_content_batches for each row execute function public.guard_handed_off_social_batch();
create or replace function public.apply_social_review_v2(check_post uuid,check_revision integer,check_version integer,check_action text,check_body text,check_patch jsonb,actor uuid,actor_label text,actor_kind text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare p public.social_review_posts; dest text; detail text; date_value timestamptz; new_content jsonb;
begin
 select * into p from public.social_review_posts where id=check_post for update;
 if p.id is null then raise exception 'Post not found'; end if;
 if check_action not in ('comment','edit','submit','request_changes','approve','schedule','reopen','move','plan','reschedule','invite','publication_preview','unschedule') then raise exception 'Unknown action'; end if;
 if length(check_body)>6000 then raise exception 'Message is too long'; end if;
 if check_action<>'comment' and (p.revision<>check_revision or (check_version is not null and p.lock_version<>check_version)) then raise exception 'This post changed. Refresh and review the latest version.'; end if;
 if check_action='publication_preview' and not p.is_test then raise exception 'Publication previews are sample-only';end if;
 if check_action in ('approve','schedule','reschedule','invite','unschedule') and not p.is_test and not exists(select 1 from public.social_review_runtime where id=true and production_enabled) then raise exception 'Real post approvals, public review links and delivery are blocked in private staging'; end if;
 if check_action in ('edit','submit','request_changes') and p.status='scheduled' then raise exception 'Return this scheduled test post to a draft first'; end if;
 if check_action='comment' and length(trim(check_body))=0 then raise exception 'Write a comment first'; end if;
 if check_action='request_changes' and (length(trim(check_body))=0) then raise exception 'Explain the changes needed on this review'; end if;
 if check_action='approve' and p.status<>'pending' then raise exception 'Submit this post for review first'; end if;
 if check_action='submit' and p.status not in ('idea','in_progress','changes_requested') then raise exception 'This post is already in review or approved'; end if;
 if check_action='submit' and (coalesce(p.content->'captions','{}'::jsonb)='{}'::jsonb or (coalesce(jsonb_array_length(p.content->'mediaIds'),0)=0 and coalesce(jsonb_array_length(p.content->'legacyMedia'),0)=0 and coalesce(p.content->>'sampleImage','')='')) then raise exception 'Add a caption and finished media before review'; end if;
 if check_action in ('schedule','reschedule','plan') then
  date_value=coalesce((check_patch->>'planned_for')::timestamptz,p.planned_for);
  if date_value is null or date_value<=now() then raise exception 'Choose a future date and Central time'; end if;
  if check_action='schedule' and (p.status<>'approved' or p.approved_revision is distinct from p.revision) then raise exception 'Approve the current version of this post first'; end if;
  if check_action='reschedule' and (p.status<>'scheduled' or p.approved_revision is distinct from p.revision) then raise exception 'Only an unchanged approved scheduled post can be rescheduled'; end if;
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
   new_content=(new_content-'legacyMedia') || jsonb_build_object('mediaIds',check_patch->'mediaIds','sampleImage',null,'sampleImages','[]'::jsonb);
  end if;
  update public.social_review_posts set title=trim(check_patch->>'title'),content=new_content,revision=revision+1,approved_revision=null,status=case when status in ('idea','in_progress') then 'in_progress' else 'changes_requested' end,updated_at=now(),lock_version=lock_version+1 where id=p.id;
 elsif check_action in ('schedule','reschedule','plan') then
  update public.social_review_posts set planned_for=date_value,status=case when check_action='plan' then status else 'scheduled' end,lock_version=lock_version+1,updated_at=now() where id=p.id;
 elsif check_action='unschedule' then
  dest=check_patch->>'target_status';
  if p.status<>'scheduled' or dest not in ('approved','pending','changes_requested') or dest is null then raise exception 'Choose a valid return status for this schedule'; end if;
  if dest='changes_requested' and length(trim(check_body))=0 then raise exception 'Explain the requested changes'; end if;
  update public.social_review_posts set status=dest,approved_revision=case when dest='approved' then approved_revision else null end,lock_version=lock_version+1,updated_at=now() where id=p.id;
 elsif check_action='move' then
  dest=check_patch->>'target_status';
  if dest not in ('idea','in_progress') or dest is null then raise exception 'Use the review or scheduling prompt for this column'; end if;
  if p.status='scheduled' and not p.is_test and not exists(select 1 from public.social_review_runtime where id=true and production_enabled) then raise exception 'Real schedules cannot be changed in private staging'; end if;
  update public.social_review_posts set status=dest,approved_revision=null,revision=revision+1,lock_version=lock_version+1,updated_at=now() where id=p.id;
 elsif check_action not in ('comment','invite','publication_preview') then
  dest=case check_action when 'submit' then 'pending' when 'request_changes' then 'changes_requested' when 'approve' then 'approved' when 'reopen' then 'in_progress' end;
  update public.social_review_posts set status=dest,approved_revision=case when check_action='approve' then revision when check_action in ('request_changes','reopen') then null else approved_revision end,revision=case when check_action='reopen' then revision+1 else revision end,lock_version=lock_version+1,updated_at=now() where id=p.id;
 end if;
 detail=case check_action
 when 'schedule' then 'Scheduled this post for '||date_value::text||'. No social network was contacted; posting is managed separately.'
 when 'reschedule' then 'Changed only this schedule to '||date_value::text||'. Content approval remains valid.'
 when 'plan' then 'Planned this post for '||date_value::text||'. This does not approve or publish it.'
 when 'approve' then 'Approved this post, revision '||p.revision||'. Other posts are unchanged.'
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
notify pgrst,'reload schema';
commit;
