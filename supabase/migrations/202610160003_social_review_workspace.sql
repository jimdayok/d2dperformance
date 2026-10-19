begin;
create table public.social_review_posts(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id),
 source_draft_id uuid unique references public.social_studio_drafts(id),
 title text not null check(length(title) between 1 and 180),
 project text not null default 'Content',
 status text not null default 'idea' check(status in ('idea','in_progress','pending','changes_requested','approved','scheduled')),
 revision integer not null default 1 check(revision>0),
 approved_revision integer, planned_for timestamptz,
 is_test boolean not null default false,
 content jsonb not null default '{}'::jsonb,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index on public.social_review_posts(organization_id,updated_at desc);
create table public.social_review_activity(
 id uuid primary key default gen_random_uuid(), post_id uuid not null references public.social_review_posts(id) on delete cascade,
 organization_id uuid not null references public.organizations(id), actor_id uuid not null references auth.users(id),
 actor_name text not null, kind text not null, body text not null check(length(body)<=6000), created_at timestamptz not null default now()
);
create index on public.social_review_activity(post_id,created_at);
alter table public.social_review_posts enable row level security;
alter table public.social_review_activity enable row level security;
create policy review_read on public.social_review_posts for select to authenticated using(public.has_product_role(organization_id,'social',array['manager','creator','reviewer'],auth.uid()));
create policy activity_read on public.social_review_activity for select to authenticated using(public.has_product_role(organization_id,'social',array['manager','creator','reviewer'],auth.uid()));
grant select on public.social_review_posts,public.social_review_activity to authenticated;
grant all on public.social_review_posts,public.social_review_activity to service_role;
-- This staging-only function has no delivery integration. Scheduling records an isolated test state.
create function public.transition_social_review(check_post uuid, check_revision integer, check_action text, check_body text default '', check_patch jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare p public.social_review_posts; next_status text; actor_name text; detail text;
begin
 select * into p from public.social_review_posts where id=check_post for update;
 if p.id is null then raise exception 'Post not found'; end if;
 if not public.has_product_role(p.organization_id,'social',array['manager','creator','reviewer'],auth.uid()) then raise exception 'Not authorized' using errcode='42501'; end if;
 if check_action not in ('comment','edit','submit','request_changes','approve','schedule','reopen') then raise exception 'Unknown action'; end if;
 if check_action in ('approve','schedule','request_changes') and not public.has_product_role(p.organization_id,'social',array['manager','reviewer'],auth.uid()) then raise exception 'Reviewer access required' using errcode='42501'; end if;
 if check_action in ('edit','submit','reopen') and not public.has_product_role(p.organization_id,'social',array['manager','creator'],auth.uid()) then raise exception 'Creator access required' using errcode='42501'; end if;
 if length(check_body)>6000 then raise exception 'Message is too long'; end if;
 if check_action <> 'comment' and p.revision<>check_revision then raise exception 'This post changed. Refresh and review the latest version.'; end if;
 if check_action in ('approve','schedule') and not p.is_test then raise exception 'Real post approvals and scheduling are blocked in private staging'; end if;
 if check_action in ('edit','submit','request_changes') and p.status='scheduled' then raise exception 'Return this scheduled test post to a draft first'; end if;
 if check_action='comment' and length(trim(check_body))=0 then raise exception 'Write a comment first'; end if;
 if check_action='request_changes' and (p.status not in ('pending','approved') or length(trim(check_body))=0) then raise exception 'Explain the changes needed on this review'; end if;
 if check_action='approve' and p.status<>'pending' then raise exception 'Submit this post for review first'; end if;
 if check_action='schedule' and (p.status<>'approved' or p.approved_revision is distinct from p.revision or p.planned_for is null or p.planned_for<=now()) then raise exception 'Approve the current post and choose a future time before scheduling'; end if;
 if check_action='submit' and p.status not in ('idea','in_progress','changes_requested') then raise exception 'This post is already in review or approved'; end if;
 if check_action='submit' and (coalesce(p.content->'captions','{}'::jsonb)='{}'::jsonb or (coalesce(jsonb_array_length(p.content->'mediaIds'),0)=0 and coalesce(p.content->>'sampleImage','')='')) then raise exception 'Add a caption and finished media before review'; end if;
 if check_action='edit' then
  if length(trim(check_patch->>'title')) not between 1 and 180 then raise exception 'Enter a post title'; end if;
  update public.social_review_posts set title=trim(check_patch->>'title'),planned_for=(check_patch->>'planned_for')::timestamptz,
   content=p.content || jsonb_build_object('captions',check_patch->'captions','brief',coalesce(check_patch->>'brief',''),'tags',coalesce(check_patch->'tags','[]'::jsonb)),
   revision=revision+1,approved_revision=null,status=case when status in ('idea','in_progress') then 'in_progress' else 'changes_requested' end,updated_at=now() where id=p.id;
 elsif check_action<>'comment' then
  next_status=case check_action when 'submit' then 'pending' when 'request_changes' then 'changes_requested' when 'approve' then 'approved' when 'schedule' then 'scheduled' when 'reopen' then 'in_progress' end;
  update public.social_review_posts set status=next_status,
    approved_revision=case when check_action='approve' then revision when check_action in ('request_changes','reopen') then null else approved_revision end,
    revision=case when check_action='reopen' then revision+1 else revision end,updated_at=now() where id=p.id;
 end if;
 select coalesce(raw_user_meta_data->>'display_name',raw_user_meta_data->>'full_name','Team member') into actor_name from auth.users where id=auth.uid();
 detail=case check_action when 'schedule' then 'Scheduled in the test calendar. No social network was contacted.' when 'approve' then 'Approved this test post, revision '||p.revision||'. Other posts are unchanged.' when 'submit' then 'Submitted this post for review.' when 'edit' then 'Saved a new revision. This post needs review again.' when 'reopen' then 'Returned this post to a draft; previous approval cleared.' else check_body end;
 insert into public.social_review_activity(post_id,organization_id,actor_id,actor_name,kind,body) values(p.id,p.organization_id,auth.uid(),coalesce(actor_name,'Team member'),check_action,detail);
 return jsonb_build_object('id',p.id,'action',check_action);
end $$;
revoke all on function public.transition_social_review(uuid,integer,text,text,jsonb) from public,anon;
grant execute on function public.transition_social_review(uuid,integer,text,text,jsonb) to authenticated;
create table public.social_review_notes(id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id),body text not null check(length(body) between 1 and 6000),actor_id uuid not null references auth.users(id),actor_name text not null,created_at timestamptz not null default now());
alter table public.social_review_notes enable row level security;
create policy notes_read on public.social_review_notes for select to authenticated using(public.has_product_role(organization_id,'social',array['manager','creator','reviewer'],auth.uid()));
grant select on public.social_review_notes to authenticated;
grant all on public.social_review_notes to service_role;
commit;
