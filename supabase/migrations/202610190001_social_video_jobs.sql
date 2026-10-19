create table if not exists public.social_video_jobs (
 id uuid primary key,
 organization_id uuid not null references public.organizations(id),
 created_by uuid not null references public.profiles(id),
 status text not null default 'preparing' check(status in ('preparing','queued','processing','completed','failed','needs_review')),
 reserved_cents integer not null check(reserved_cents between 5 and 20),
 content jsonb not null,
 tasks jsonb not null default '[]',
 message text not null default 'Preparing animation.',
 draft_id uuid,
 lease_until timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.social_video_jobs enable row level security;
revoke all on public.social_video_jobs from anon,authenticated;
grant all on public.social_video_jobs to service_role;
create index if not exists social_video_jobs_status on public.social_video_jobs(status,created_at);
create or replace function public.reserve_social_video_job(check_id uuid,check_organization uuid,check_user uuid,check_content jsonb,check_cents integer,check_budget integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare existing public.social_video_jobs; used integer;
begin
 perform pg_advisory_xact_lock(hashtext('d2d-wavespeed-budget'));
 select * into existing from public.social_video_jobs where id=check_id;
 if found then
  if existing.organization_id<>check_organization or existing.created_by<>check_user then raise exception 'Video request unavailable.'; end if;
  return jsonb_build_object('id',existing.id,'status',existing.status,'existing',true);
 end if;
 if check_cents not in (5,10,15,20) or check_budget<check_cents then raise exception 'The free-credit test allowance is exhausted. Nothing has been purchased.'; end if;
 select coalesce(sum(reserved_cents),0) into used from public.social_video_jobs;
 if used+check_cents>check_budget then raise exception 'The free-credit test allowance is reserved or exhausted. Nothing has been purchased.'; end if;
 insert into public.social_video_jobs(id,organization_id,created_by,reserved_cents,content)
 values(check_id,check_organization,check_user,check_cents,check_content);
 return jsonb_build_object('id',check_id,'status','preparing','existing',false);
end $$;
revoke all on function public.reserve_social_video_job(uuid,uuid,uuid,jsonb,integer,integer) from public,anon,authenticated;
grant execute on function public.reserve_social_video_job(uuid,uuid,uuid,jsonb,integer,integer) to service_role;
