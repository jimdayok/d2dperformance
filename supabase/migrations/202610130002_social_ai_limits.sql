begin;
create table public.social_ai_limits (
 organization_id uuid primary key references public.organizations(id),
 enabled boolean not null default true,
 daily_limit integer not null default 5 check(daily_limit between 0 and 100),
 monthly_limit integer not null default 60 check(monthly_limit between 0 and 1000),
 concurrent_limit integer not null default 2 check(concurrent_limit between 1 and 5),
 video_enabled boolean not null default true,
 updated_by uuid references public.profiles(id),
 updated_at timestamptz not null default now()
);
alter table public.social_ai_limits enable row level security;
alter table public.social_ai_jobs add column kind text check(kind in ('graphic','video')),
 add column token_estimate jsonb, add column copy_usage jsonb, add column image_usage jsonb;
create index social_ai_jobs_org_created on public.social_ai_jobs(organization_id,created_at);
create function public.reserve_social_ai_job(check_id uuid,check_organization uuid,check_user uuid,check_kind text,check_sources jsonb,check_estimate jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare limits social_ai_limits; existing social_ai_jobs; today_start timestamptz; month_start timestamptz; n integer;
begin
 insert into social_ai_limits(organization_id) values(check_organization) on conflict do nothing;
 select * into limits from social_ai_limits where organization_id=check_organization for update;
 select * into existing from social_ai_jobs where id=check_id;
 if found then
  if existing.created_by<>check_user or existing.organization_id<>check_organization then raise exception 'Draft request not available.'; end if;
  return jsonb_build_object('id',existing.id,'existing',true,'status',existing.status);
 end if;
 if check_kind not in ('graphic','video') then raise exception 'Invalid format.'; end if;
 if not limits.enabled then raise exception 'AI generation is paused for this customer. Contact D2D.'; end if;
 if check_kind='video' and not limits.video_enabled then raise exception 'Video generation is disabled for this customer.'; end if;
 today_start=date_trunc('day',now() at time zone 'America/Chicago') at time zone 'America/Chicago';
 month_start=date_trunc('month',now() at time zone 'America/Chicago') at time zone 'America/Chicago';
 select count(*) into n from social_ai_jobs where organization_id=check_organization and created_at>=today_start;
 if n>=limits.daily_limit then raise exception 'This customer has reached the daily AI limit. Try again tomorrow (Central time).'; end if;
 select count(*) into n from social_ai_jobs where organization_id=check_organization and created_at>=month_start;
 if n>=limits.monthly_limit then raise exception 'This customer has reached the monthly AI limit. Contact D2D or wait until next month.'; end if;
 select count(*) into n from social_ai_jobs where organization_id=check_organization and status='processing' and created_at>now()-interval '10 minutes';
 if n>=limits.concurrent_limit then raise exception 'This customer already has drafts being generated. Please wait for them to finish.'; end if;
 insert into social_ai_jobs(id,organization_id,created_by,status,brand_sources,kind,token_estimate)
 values(check_id,check_organization,check_user,'processing',check_sources,check_kind,check_estimate);
 return jsonb_build_object('id',check_id,'existing',false,'status','processing');
end; $$;
revoke all on function public.reserve_social_ai_job(uuid,uuid,uuid,text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_social_ai_job(uuid,uuid,uuid,text,jsonb,jsonb) to service_role;
commit;
