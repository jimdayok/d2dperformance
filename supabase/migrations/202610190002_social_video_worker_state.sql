create table if not exists public.social_video_worker_state (
 id boolean primary key default true check(id),
 connected boolean not null default false,
 balance numeric not null default 0,
 budget_cents integer not null default 0 check(budget_cents>=0),
 updated_at timestamptz not null default now()
);
alter table public.social_video_worker_state enable row level security;
revoke all on public.social_video_worker_state from anon,authenticated;
grant all on public.social_video_worker_state to service_role;
create or replace function public.reserve_social_video_job(check_id uuid,check_organization uuid,check_user uuid,check_content jsonb,check_cents integer,check_budget integer)
returns jsonb language plpgsql security definer set search_path=public as $$
declare existing public.social_video_jobs; used integer; allowed integer;
begin
 perform pg_advisory_xact_lock(hashtext('d2d-wavespeed-budget'));
 select * into existing from public.social_video_jobs where id=check_id;
 if found then
  if existing.organization_id<>check_organization or existing.created_by<>check_user then raise exception 'Video request unavailable.'; end if;
  return jsonb_build_object('id',existing.id,'status',existing.status,'existing',true);
 end if;
 select budget_cents into allowed from public.social_video_worker_state where id=true and connected and updated_at>now()-interval '90 seconds';
 if not found then raise exception 'The video service is offline. No generation was submitted.'; end if;
 check_budget:=least(check_budget,allowed);
 if check_cents not in (5,10,15,20) or check_budget<check_cents then raise exception 'The free-credit test allowance is exhausted. Nothing has been purchased.'; end if;
 select coalesce(sum(reserved_cents),0) into used from public.social_video_jobs;
 if used+check_cents>check_budget then raise exception 'The free-credit test allowance is reserved or exhausted. Nothing has been purchased.'; end if;
 insert into public.social_video_jobs(id,organization_id,created_by,reserved_cents,content)
 values(check_id,check_organization,check_user,check_cents,check_content);
 return jsonb_build_object('id',check_id,'status','preparing','existing',false);
end $$;
revoke all on function public.reserve_social_video_job(uuid,uuid,uuid,jsonb,integer,integer) from public,anon,authenticated;
grant execute on function public.reserve_social_video_job(uuid,uuid,uuid,jsonb,integer,integer) to service_role;
