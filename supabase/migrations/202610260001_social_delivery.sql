begin;
create table public.social_delivery_install_backup as
select now() saved_at, 'apply_social_review_v2' object_name, pg_get_functiondef('public.apply_social_review_v2(uuid,integer,integer,text,text,jsonb,uuid,text,text)'::regprocedure) definition
union all select now(),'queue_social_review_email',pg_get_functiondef('public.queue_social_review_email()'::regprocedure);
alter table public.social_delivery_install_backup enable row level security;
revoke all on public.social_delivery_install_backup from public,anon,authenticated;
grant select on public.social_delivery_install_backup to service_role;
create table public.social_delivery_routes (
 organization_id uuid not null references public.organizations(id),
 platform text not null, account_id text not null, enabled_from timestamptz not null default now(),
 primary key(organization_id,platform)
);
create table public.social_deliveries (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.social_review_posts(id),
 organization_id uuid not null references public.organizations(id),
 revision integer not null, planned_for timestamptz not null,
 snapshot jsonb not null, state text not null default 'preparing'
 check(state in ('preparing','dispatching','submitted','published','failed','uncertain','cancelled')),
 engine_post_id text, result jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index social_delivery_one_revision on public.social_deliveries(post_id,revision) where state<>'cancelled';
alter table public.social_delivery_routes enable row level security;
alter table public.social_deliveries enable row level security;
revoke all on public.social_delivery_routes,public.social_deliveries from public,anon,authenticated;
grant all on public.social_delivery_routes,public.social_deliveries to service_role;
create policy delivery_read on public.social_deliveries for select to authenticated using (
 public.has_product_role(organization_id,'social',array['manager','creator','reviewer'],auth.uid()));
grant select on public.social_deliveries to authenticated;
create table public.social_delivery_catchup(post_id uuid primary key references public.social_review_posts(id));
alter table public.social_delivery_catchup enable row level security;
revoke all on public.social_delivery_catchup from public,anon,authenticated;
grant all on public.social_delivery_catchup to service_role;

create function public.claim_social_delivery() returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare p public.social_review_posts; j public.social_deliveries;
begin
 if not exists(select 1 from public.social_review_runtime where id=true and production_enabled) then return null;end if;
 select r.* into p from public.social_review_posts r
 where r.status in ('approved','scheduled') and not r.is_test and r.approved_revision=r.revision
 and r.planned_for<=now()
 and coalesce(r.legacy_batch_status,'') not in ('scheduled','scheduling','published')
 and exists(select 1 from public.social_delivery_routes t where t.organization_id=r.organization_id
  and r.content->'captions' ? t.platform
  and (r.planned_for>=t.enabled_from or exists(select 1 from public.social_delivery_catchup c where c.post_id=r.id)))
 and not exists(select 1 from public.social_deliveries d where d.post_id=r.id and d.revision=r.revision and d.state<>'cancelled')
 order by r.planned_for for update skip locked limit 1;
 if p.id is null then return null;end if;
 insert into public.social_deliveries(post_id,organization_id,revision,planned_for,snapshot)
 values(p.id,p.organization_id,p.revision,p.planned_for,to_jsonb(p)) returning * into j;
 return to_jsonb(j);
end $$;
revoke all on function public.claim_social_delivery() from public,anon,authenticated;
grant execute on function public.claim_social_delivery() to service_role;

create function public.begin_social_dispatch(check_delivery uuid,check_engine text) returns boolean
language plpgsql security definer set search_path=pg_catalog,public as $$
declare p public.social_review_posts;j public.social_deliveries;
begin
 select * into j from public.social_deliveries where id=check_delivery;
 select * into p from public.social_review_posts where id=j.post_id for update;
 select * into j from public.social_deliveries where id=check_delivery for update;
 if j.state<>'preparing' then return false;end if;
 if p.is_test or p.status not in ('approved','scheduled') or p.revision<>j.revision or p.approved_revision<>j.revision
 or p.planned_for is distinct from j.planned_for or p.content is distinct from j.snapshot->'content'
 or not exists(select 1 from public.social_review_runtime where id=true and production_enabled) then
 update public.social_deliveries set state='cancelled',updated_at=now() where id=j.id;return false;end if;
 update public.social_deliveries set state='dispatching',engine_post_id=check_engine,updated_at=now() where id=j.id;
 return true;
end $$;
revoke all on function public.begin_social_dispatch(uuid,text) from public,anon,authenticated;
grant execute on function public.begin_social_dispatch(uuid,text) to service_role;

create function public.guard_social_delivery() returns trigger
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if row(new.content,new.status,new.revision,new.approved_revision,new.planned_for,new.is_test,new.organization_id)
 is distinct from row(old.content,old.status,old.revision,old.approved_revision,old.planned_for,old.is_test,old.organization_id) then
  if exists(select 1 from public.social_deliveries where post_id=old.id and state in ('dispatching','submitted','published','uncertain')) then
   raise exception 'This post has entered publishing. Check its delivery result; create a new post for different content.';
  end if;
  update public.social_deliveries set state='cancelled',updated_at=now() where post_id=old.id and state='preparing';
 end if;
 return new;
end $$;
revoke all on function public.guard_social_delivery() from public,anon,authenticated;
create trigger social_delivery_revision_guard before update on public.social_review_posts for each row execute function public.guard_social_delivery();

-- Existing review permissions, revision checks and email routing stay in their owning function.
do $$
declare definition text;
begin
 select pg_get_functiondef('public.apply_social_review_v2(uuid,integer,integer,text,text,jsonb,uuid,text,text)'::regprocedure) into definition;
 definition=replace(definition,
 'when ''approve'' then ''approved''',
 'when ''approve'' then case when p.planned_for>now() and exists(select 1 from public.social_delivery_routes t where t.organization_id=p.organization_id and p.content->''captions'' ? t.platform) then ''scheduled'' else ''approved'' end');
 definition=replace(definition,
 'case when check_action=''plan'' then status else ''scheduled'' end',
 'case when check_action=''plan'' and (approved_revision is distinct from revision or not exists(select 1 from public.social_delivery_routes t where t.organization_id=p.organization_id and p.content->''captions'' ? t.platform)) then status else ''scheduled'' end');
 definition=replace(definition,
 'set status=dest,approved_revision=case when dest=''approved''',
 'set planned_for=null,status=dest,approved_revision=case when dest=''approved''');
 definition=replace(definition,'No social network was contacted; posting is managed separately.','Approved content will publish at this time when its destination is connected.');
 execute definition;
end $$;
-- Delivery receipts are visible in the post activity; they do not send extra email.
do $$
declare definition text;
begin
 select pg_get_functiondef('public.queue_social_review_email()'::regprocedure) into definition;
 definition=replace(definition,'begin', 'begin
 if new.kind like ''delivery_%'' then return new;end if;');
 execute definition;
end $$;
notify pgrst,'reload schema';
commit;
