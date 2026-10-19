begin;

-- Preserve the exact prior reservation function and legacy content fingerprints before replacement.
create table if not exists public.social_review_launch_backup(
 id text primary key,previous_ai_reservation text,legacy_items_count bigint,legacy_items_hash text,legacy_batches_hash text,created_at timestamptz not null default now()
);
alter table public.social_review_launch_backup enable row level security;
revoke all on public.social_review_launch_backup from public,anon,authenticated;
grant all on public.social_review_launch_backup to service_role;
insert into public.social_review_launch_backup(id,previous_ai_reservation,legacy_items_count,legacy_items_hash,legacy_batches_hash)
select 'D2DP-2610181907',(select pg_get_functiondef(oid) from pg_proc where pronamespace='public'::regnamespace and proname='reserve_social_ai_job' limit 1),
 (select count(*) from public.social_content_items),(select md5(coalesce(string_agg(to_jsonb(i)::text,'' order by id),'')) from public.social_content_items i),
 (select md5(coalesce(string_agg(to_jsonb(b)::text,'' order by id),'')) from public.social_content_batches b)
on conflict(id) do nothing;

-- Local media edits use no OpenAI tokens and do not consume AI generation allowances.
create or replace function public.reserve_social_ai_job(check_id uuid,check_organization uuid,check_user uuid,check_kind text,check_sources jsonb,check_estimate jsonb)
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
 if not limits.enabled and coalesce((check_estimate->>'totalAllowance')::integer,1)>0 then raise exception 'AI generation is paused for this customer. Contact D2D.'; end if;
 if check_kind='video' and not limits.video_enabled then raise exception 'Video generation is disabled for this customer.'; end if;
 today_start=date_trunc('day',now() at time zone 'America/Chicago') at time zone 'America/Chicago';
 month_start=date_trunc('month',now() at time zone 'America/Chicago') at time zone 'America/Chicago';
 select count(*) into n from social_ai_jobs where organization_id=check_organization and created_at>=today_start and coalesce((token_estimate->>'totalAllowance')::integer,1)>0;
 if n>=limits.daily_limit and coalesce((check_estimate->>'totalAllowance')::integer,1)>0 then raise exception 'This customer has reached the daily AI limit. Try again tomorrow (Central time).'; end if;
 select count(*) into n from social_ai_jobs where organization_id=check_organization and created_at>=month_start and coalesce((token_estimate->>'totalAllowance')::integer,1)>0;
 if n>=limits.monthly_limit and coalesce((check_estimate->>'totalAllowance')::integer,1)>0 then raise exception 'This customer has reached the monthly AI limit. Contact D2D or wait until next month.'; end if;
 if coalesce((check_estimate->>'totalAllowance')::integer,1)=0 then
  select count(*) into n from social_ai_jobs where organization_id=check_organization and created_at>=today_start and token_estimate->>'totalAllowance'='0';
  if n>=50 then raise exception 'This customer has reached the daily media editing limit. Try again tomorrow (Central time).'; end if;
 end if;
 select count(*) into n from social_ai_jobs where organization_id=check_organization and status='processing' and created_at>now()-interval '10 minutes';
 if n>=limits.concurrent_limit then raise exception 'This customer already has drafts being generated. Please wait for them to finish.'; end if;
 insert into social_ai_jobs(id,organization_id,created_by,status,brand_sources,kind,token_estimate)
 values(check_id,check_organization,check_user,'processing',check_sources,check_kind,check_estimate);
 return jsonb_build_object('id',check_id,'existing',false,'status','processing');
end; $$;
commit;
