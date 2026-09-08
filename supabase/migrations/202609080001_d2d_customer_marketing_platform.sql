begin;

create table if not exists public.product_entitlements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product text not null check (product in ('social', 'brand_vault', 'web_management')),
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  launch_url text not null check (launch_url ~ '^https://'),
  external_workspace_id text,
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, product)
);

create table if not exists public.organization_product_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product text not null check (product in ('social', 'brand_vault', 'web_management')),
  role text not null check (role in ('manager', 'creator', 'reviewer', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, product)
);

create index if not exists organization_product_members_user_idx
  on public.organization_product_members(user_id, organization_id);

create table if not exists public.marketing_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (length(title) between 1 and 180),
  period_start date not null,
  period_end date not null,
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'changes_requested', 'approved', 'superseded', 'archived')),
  current_revision integer not null default 1 check (current_revision > 0),
  approved_revision integer check (approved_revision is null or approved_revision > 0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start),
  check (approved_revision is null or approved_revision <= current_revision)
);

create index if not exists marketing_plans_org_period_idx
  on public.marketing_plans(organization_id, period_start desc);

create table if not exists public.marketing_plan_versions (
  id uuid primary key default gen_random_uuid(),
  marketing_plan_id uuid not null references public.marketing_plans(id) on delete restrict,
  revision integer not null check (revision > 0),
  plan jsonb not null check (jsonb_typeof(plan) = 'object'),
  summary text not null default '',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (marketing_plan_id, revision)
);

create table if not exists public.marketing_plan_reviews (
  id uuid primary key default gen_random_uuid(),
  marketing_plan_id uuid not null references public.marketing_plans(id) on delete restrict,
  revision integer not null check (revision > 0),
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  decision text not null check (decision in ('approved', 'changes_requested')),
  note text not null default '' check (length(note) <= 5000),
  created_at timestamptz not null default now()
);

create index if not exists marketing_plan_reviews_plan_idx
  on public.marketing_plan_reviews(marketing_plan_id, created_at desc);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(name) between 1 and 180),
  description text not null check (length(description) between 1 and 5000),
  offer_terms text not null default '' check (length(offer_terms) <= 5000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  submission_deadline timestamptz,
  channels text[] not null default '{}',
  assets jsonb not null default '[]'::jsonb check (jsonb_typeof(assets) = 'array'),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'submitted'
    check (status in ('submitted', 'accepted', 'planned', 'completed', 'cancelled')),
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at >= starts_at)
);

create index if not exists promotions_org_dates_idx
  on public.promotions(organization_id, starts_at, ends_at);

create table if not exists public.social_content_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  marketing_plan_id uuid references public.marketing_plans(id) on delete set null,
  title text not null check (length(title) between 1 and 180),
  period_start date not null,
  period_end date not null,
  status text not null default 'draft'
    check (status in ('draft', 'internal_review', 'client_review', 'changes_requested', 'approved', 'scheduling', 'scheduled', 'published', 'failed', 'archived')),
  approval_version integer not null default 1 check (approval_version > 0),
  approved_approval_version integer,
  shoutrrr_workspace_id text,
  sync_error text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start),
  check (approved_approval_version is null or approved_approval_version <= approval_version)
);

create index if not exists social_content_batches_org_period_idx
  on public.social_content_batches(organization_id, period_start desc);

create table if not exists public.social_content_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.social_content_batches(id) on delete cascade,
  content_day integer not null check (content_day > 0),
  platform text not null check (platform in ('facebook', 'instagram', 'linkedin')),
  caption text not null check (length(caption) between 1 and 10000),
  media jsonb not null default '[]'::jsonb check (jsonb_typeof(media) = 'array'),
  creative_brief text not null default '' check (length(creative_brief) <= 3000),
  required_assets jsonb not null default '[]'::jsonb check (jsonb_typeof(required_assets) = 'array'),
  scheduled_for timestamptz not null,
  current_revision integer not null default 1 check (current_revision > 0),
  approved_revision integer,
  shoutrrr_post_id text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (batch_id, content_day, platform),
  check (approved_revision is null or approved_revision <= current_revision)
);

create index if not exists social_content_items_schedule_idx
  on public.social_content_items(batch_id, scheduled_for);

create table if not exists public.social_content_item_versions (
  id uuid primary key default gen_random_uuid(),
  social_content_item_id uuid not null references public.social_content_items(id) on delete restrict,
  revision integer not null check (revision > 0),
  caption text not null,
  media jsonb not null check (jsonb_typeof(media) = 'array'),
  scheduled_for timestamptz not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (social_content_item_id, revision)
);

create table if not exists public.social_batch_reviews (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.social_content_batches(id) on delete restrict,
  approval_version integer not null check (approval_version > 0),
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  decision text not null check (decision in ('approved', 'changes_requested')),
  note text not null default '' check (length(note) <= 5000),
  created_at timestamptz not null default now()
);

create index if not exists social_batch_reviews_batch_idx
  on public.social_batch_reviews(batch_id, created_at desc);

create table if not exists public.platform_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (length(action) between 1 and 160),
  subject_type text not null check (length(subject_type) between 1 and 80),
  subject_id text not null check (length(subject_id) between 1 and 180),
  detail jsonb not null default '{}'::jsonb check (jsonb_typeof(detail) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists platform_audit_events_org_idx
  on public.platform_audit_events(organization_id, created_at desc);

create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.email, '')
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = case
          when public.profiles.display_name = '' then excluded.display_name
          else public.profiles.display_name
        end;
  return new;
end;
$$;

drop trigger if exists auth_user_sync_profile on auth.users;
create trigger auth_user_sync_profile
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.sync_profile_from_auth_user();

insert into public.profiles (id, display_name, email)
select u.id,
  coalesce(u.raw_user_meta_data ->> 'display_name', u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(u.email, '')
from auth.users u
on conflict (id) do nothing;

create or replace function public.has_product_role(
  check_organization uuid,
  check_product text,
  allowed_roles text[],
  check_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.is_platform_admin(check_user)
    or (
      exists (
        select 1 from public.product_entitlements e
        where e.organization_id = check_organization
          and e.product = check_product
          and e.status = 'active'
      )
      and exists (
        select 1 from public.organization_product_members m
        where m.organization_id = check_organization
          and m.user_id = check_user
          and m.product = check_product
          and m.role = any(allowed_roles)
      )
    )
$$;

create or replace function public.admin_set_product_entitlement(
  check_organization uuid,
  check_product text,
  check_status text,
  check_launch_url text,
  check_external_workspace_id text default null
)
returns public.product_entitlements
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.product_entitlements;
begin
  if not public.is_platform_admin(auth.uid()) then raise exception 'platform administrator required' using errcode = '42501'; end if;
  if check_product not in ('social', 'brand_vault', 'web_management') then raise exception 'invalid product' using errcode = '22023'; end if;
  if check_status not in ('active', 'suspended', 'archived') then raise exception 'invalid entitlement status' using errcode = '22023'; end if;
  if check_launch_url !~ '^https://' then raise exception 'launch URL must use HTTPS' using errcode = '22023'; end if;
  insert into public.product_entitlements(organization_id, product, status, launch_url, external_workspace_id)
  values (check_organization, check_product, check_status, check_launch_url, nullif(trim(check_external_workspace_id), ''))
  on conflict (organization_id, product) do update
    set status = excluded.status,
        launch_url = excluded.launch_url,
        external_workspace_id = excluded.external_workspace_id,
        updated_at = now()
  returning * into target;
  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id, detail)
  values (check_organization, auth.uid(), 'product_entitlement.set', 'product_entitlement', target.id::text,
    jsonb_build_object('product', target.product, 'status', target.status));
  return target;
end;
$$;

create or replace function public.admin_set_product_member(
  check_organization uuid,
  check_user uuid,
  check_product text,
  check_role text
)
returns public.organization_product_members
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.organization_product_members;
begin
  if not public.is_platform_admin(auth.uid()) then raise exception 'platform administrator required' using errcode = '42501'; end if;
  if check_product not in ('social', 'brand_vault', 'web_management') then raise exception 'invalid product' using errcode = '22023'; end if;
  if check_role not in ('manager', 'creator', 'reviewer', 'viewer') then raise exception 'invalid product role' using errcode = '22023'; end if;
  if not exists (
    select 1 from public.product_entitlements
    where organization_id = check_organization and product = check_product and status = 'active'
  ) then raise exception 'activate the product entitlement before adding a member' using errcode = '55000'; end if;
  insert into public.organization_product_members(organization_id, user_id, product, role)
  values (check_organization, check_user, check_product, check_role)
  on conflict (organization_id, user_id, product) do update
    set role = excluded.role, updated_at = now()
  returning * into target;
  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id, detail)
  values (check_organization, auth.uid(), 'product_member.set', 'organization_product_member', target.id::text,
    jsonb_build_object('product', target.product, 'role', target.role, 'user_id', target.user_id));
  return target;
end;
$$;

create or replace function public.prevent_immutable_marketing_records()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'approved review and version records are immutable' using errcode = '55000';
end;
$$;

create trigger marketing_plan_versions_immutable
before update or delete on public.marketing_plan_versions
for each row execute function public.prevent_immutable_marketing_records();

create trigger marketing_plan_reviews_immutable
before update or delete on public.marketing_plan_reviews
for each row execute function public.prevent_immutable_marketing_records();

create trigger social_content_item_versions_immutable
before update or delete on public.social_content_item_versions
for each row execute function public.prevent_immutable_marketing_records();

create trigger social_batch_reviews_immutable
before update or delete on public.social_batch_reviews
for each row execute function public.prevent_immutable_marketing_records();

create or replace function public.reset_social_approval_on_change()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if old.caption is distinct from new.caption
    or old.media is distinct from new.media
    or old.scheduled_for is distinct from new.scheduled_for
    or old.platform is distinct from new.platform then
    new.current_revision := old.current_revision + 1;
    new.approved_revision := null;
    update public.social_content_batches
      set status = case when status in ('approved', 'scheduling', 'scheduled') then 'client_review' else status end,
          approval_version = approval_version + 1,
          approved_approval_version = null,
          sync_error = null,
          updated_at = now()
      where id = new.batch_id;
  end if;
  return new;
end;
$$;

create trigger social_content_item_reset_approval
before update on public.social_content_items
for each row execute function public.reset_social_approval_on_change();

create trigger product_entitlements_set_updated_at before update on public.product_entitlements
  for each row execute function public.set_updated_at();
create trigger organization_product_members_set_updated_at before update on public.organization_product_members
  for each row execute function public.set_updated_at();
create trigger marketing_plans_set_updated_at before update on public.marketing_plans
  for each row execute function public.set_updated_at();
create trigger promotions_set_updated_at before update on public.promotions
  for each row execute function public.set_updated_at();
create trigger social_content_batches_set_updated_at before update on public.social_content_batches
  for each row execute function public.set_updated_at();
create trigger social_content_items_set_updated_at before update on public.social_content_items
  for each row execute function public.set_updated_at();

create or replace function public.review_marketing_plan(
  check_plan uuid,
  check_decision text,
  check_note text default ''
)
returns public.marketing_plans
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.marketing_plans;
begin
  if check_decision not in ('approved', 'changes_requested') then
    raise exception 'invalid review decision' using errcode = '22023';
  end if;
  select * into target from public.marketing_plans where id = check_plan for update;
  if target.id is null then raise exception 'marketing plan not found' using errcode = 'P0002'; end if;
  if target.status <> 'in_review' then raise exception 'marketing plan is not awaiting review' using errcode = '55000'; end if;
  if not public.has_product_role(target.organization_id, 'social', array['manager', 'reviewer'], auth.uid()) then
    raise exception 'not authorized to review this marketing plan' using errcode = '42501';
  end if;
  insert into public.marketing_plan_reviews(marketing_plan_id, revision, reviewer_id, decision, note)
  values (target.id, target.current_revision, auth.uid(), check_decision, coalesce(check_note, ''));
  update public.marketing_plans
    set status = check_decision,
        approved_revision = case when check_decision = 'approved' then current_revision else null end,
        updated_at = now()
    where id = target.id
    returning * into target;
  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id, detail)
  values (target.organization_id, auth.uid(), 'marketing_plan.' || check_decision, 'marketing_plan', target.id::text,
    jsonb_build_object('revision', target.current_revision));
  return target;
end;
$$;

create or replace function public.create_marketing_plan_draft(
  check_organization uuid,
  check_title text,
  check_period_start date,
  check_period_end date,
  check_summary text,
  check_plan jsonb
)
returns public.marketing_plans
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.marketing_plans;
begin
  if not public.has_product_role(check_organization, 'social', array['manager', 'creator'], auth.uid()) then
    raise exception 'not authorized to create a marketing plan' using errcode = '42501';
  end if;
  if check_period_end < check_period_start then raise exception 'invalid plan period' using errcode = '22023'; end if;
  if jsonb_typeof(check_plan) <> 'object' then raise exception 'plan must be an object' using errcode = '22023'; end if;
  insert into public.marketing_plans(organization_id, title, period_start, period_end, created_by)
  values (check_organization, check_title, check_period_start, check_period_end, auth.uid())
  returning * into target;
  insert into public.marketing_plan_versions(marketing_plan_id, revision, plan, summary, created_by)
  values (target.id, 1, check_plan, coalesce(check_summary, ''), auth.uid());
  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id)
  values (target.organization_id, auth.uid(), 'marketing_plan.created', 'marketing_plan', target.id::text);
  return target;
end;
$$;

create or replace function public.submit_marketing_plan_for_review(check_plan uuid)
returns public.marketing_plans
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.marketing_plans;
begin
  select * into target from public.marketing_plans where id = check_plan for update;
  if target.id is null then raise exception 'marketing plan not found' using errcode = 'P0002'; end if;
  if not public.has_product_role(target.organization_id, 'social', array['manager', 'creator'], auth.uid()) then
    raise exception 'not authorized to submit this marketing plan' using errcode = '42501';
  end if;
  if target.status not in ('draft', 'changes_requested') then
    raise exception 'marketing plan cannot be submitted from its current status' using errcode = '55000';
  end if;
  update public.marketing_plans set status = 'in_review', approved_revision = null, updated_at = now()
    where id = target.id returning * into target;
  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id, detail)
  values (target.organization_id, auth.uid(), 'marketing_plan.submitted', 'marketing_plan', target.id::text,
    jsonb_build_object('revision', target.current_revision));
  return target;
end;
$$;

create or replace function public.revise_marketing_plan(
  check_plan uuid,
  check_title text,
  check_summary text,
  check_content jsonb
)
returns public.marketing_plans
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.marketing_plans;
begin
  select * into target from public.marketing_plans where id = check_plan for update;
  if target.id is null then raise exception 'marketing plan not found' using errcode = 'P0002'; end if;
  if not public.has_product_role(target.organization_id, 'social', array['manager', 'creator'], auth.uid()) then
    raise exception 'not authorized to revise this marketing plan' using errcode = '42501';
  end if;
  if target.status not in ('draft', 'changes_requested', 'approved') then
    raise exception 'plan cannot be revised from its current status' using errcode = '55000';
  end if;
  if coalesce(length(trim(check_title)), 0) = 0 or length(check_title) > 180 then
    raise exception 'plan title is required and must not exceed 180 characters' using errcode = '22023';
  end if;
  if jsonb_typeof(check_content) <> 'object' then raise exception 'plan must be an object' using errcode = '22023'; end if;
  update public.marketing_plans
    set title = check_title,
        current_revision = current_revision + 1,
        approved_revision = null,
        status = 'draft',
        updated_at = now()
    where id = target.id returning * into target;
  insert into public.marketing_plan_versions(marketing_plan_id, revision, plan, summary, created_by)
  values (target.id, target.current_revision, check_content, coalesce(check_summary, ''), auth.uid());
  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id, detail)
  values (target.organization_id, auth.uid(), 'marketing_plan.revised', 'marketing_plan', target.id::text,
    jsonb_build_object('revision', target.current_revision));
  return target;
end;
$$;

create or replace function public.review_social_batch(
  check_batch uuid,
  check_decision text,
  check_note text default ''
)
returns public.social_content_batches
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.social_content_batches;
begin
  if check_decision not in ('approved', 'changes_requested') then
    raise exception 'invalid review decision' using errcode = '22023';
  end if;
  select * into target from public.social_content_batches where id = check_batch for update;
  if target.id is null then raise exception 'social content batch not found' using errcode = 'P0002'; end if;
  if target.status <> 'client_review' then raise exception 'batch is not awaiting customer review' using errcode = '55000'; end if;
  if not public.has_product_role(target.organization_id, 'social', array['manager', 'reviewer'], auth.uid()) then
    raise exception 'not authorized to review this content' using errcode = '42501';
  end if;
  if not exists (select 1 from public.social_content_items where batch_id = target.id) then
    raise exception 'an empty batch cannot be approved' using errcode = '55000';
  end if;
  insert into public.social_batch_reviews(batch_id, approval_version, reviewer_id, decision, note)
  values (target.id, target.approval_version, auth.uid(), check_decision, coalesce(check_note, ''));
  if check_decision = 'approved' then
    update public.social_content_items set approved_revision = current_revision where batch_id = target.id;
  else
    update public.social_content_items set approved_revision = null where batch_id = target.id;
  end if;
  update public.social_content_batches
    set status = check_decision,
        approved_approval_version = case when check_decision = 'approved' then approval_version else null end,
        sync_error = null,
        updated_at = now()
    where id = target.id
    returning * into target;
  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id, detail)
  values (target.organization_id, auth.uid(), 'social_batch.' || check_decision, 'social_content_batch', target.id::text,
    jsonb_build_object('approval_version', target.approval_version));
  return target;
end;
$$;

create or replace function public.create_social_batch_from_json(
  check_organization uuid,
  check_marketing_plan uuid,
  check_title text,
  check_period_start date,
  check_period_end date,
  check_items jsonb
)
returns public.social_content_batches
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.social_content_batches;
  item jsonb;
  platform_name text;
  inserted_item public.social_content_items;
begin
  if not public.has_product_role(check_organization, 'social', array['manager', 'creator'], auth.uid()) then
    raise exception 'not authorized to create social content' using errcode = '42501';
  end if;
  if check_period_end < check_period_start then raise exception 'invalid content period' using errcode = '22023'; end if;
  if jsonb_typeof(check_items) <> 'array' or jsonb_array_length(check_items) = 0 then
    raise exception 'content items must be a non-empty array' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.marketing_plans p
    where p.id = check_marketing_plan and p.organization_id = check_organization
      and p.status = 'approved' and p.approved_revision = p.current_revision
  ) then
    raise exception 'an approved current marketing plan is required' using errcode = '55000';
  end if;
  insert into public.social_content_batches(
    organization_id, marketing_plan_id, title, period_start, period_end, status, created_by
  ) values (
    check_organization, check_marketing_plan, check_title, check_period_start, check_period_end, 'internal_review', auth.uid()
  ) returning * into target;
  for item in select value from jsonb_array_elements(check_items)
  loop
    foreach platform_name in array array['facebook', 'instagram', 'linkedin']
    loop
      insert into public.social_content_items(
        batch_id, content_day, platform, caption, scheduled_for, creative_brief, required_assets, created_by
      ) values (
        target.id,
        (item ->> 'day')::integer,
        platform_name,
        item -> 'captions' ->> platform_name,
        (item ->> 'scheduledFor')::timestamptz,
        coalesce(item ->> 'visualBrief', ''),
        coalesce(item -> 'requiredAssets', '[]'::jsonb),
        auth.uid()
      ) returning * into inserted_item;
      insert into public.social_content_item_versions(
        social_content_item_id, revision, caption, media, scheduled_for, created_by
      ) values (
        inserted_item.id, inserted_item.current_revision, inserted_item.caption,
        inserted_item.media, inserted_item.scheduled_for, auth.uid()
      );
    end loop;
  end loop;
  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id)
  values (target.organization_id, auth.uid(), 'social_batch.created', 'social_content_batch', target.id::text);
  return target;
end;
$$;

create or replace function public.submit_social_batch_for_client_review(check_batch uuid)
returns public.social_content_batches
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.social_content_batches;
begin
  select * into target from public.social_content_batches where id = check_batch for update;
  if target.id is null then raise exception 'social content batch not found' using errcode = 'P0002'; end if;
  if not public.has_product_role(target.organization_id, 'social', array['manager', 'creator'], auth.uid()) then
    raise exception 'not authorized to submit this content' using errcode = '42501';
  end if;
  if target.status not in ('internal_review', 'changes_requested') then
    raise exception 'batch cannot be submitted from its current status' using errcode = '55000';
  end if;
  update public.social_content_batches
    set status = 'client_review', approved_approval_version = null, sync_error = null, updated_at = now()
    where id = target.id returning * into target;
  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id, detail)
  values (target.organization_id, auth.uid(), 'social_batch.submitted', 'social_content_batch', target.id::text,
    jsonb_build_object('approval_version', target.approval_version));
  return target;
end;
$$;

create or replace function public.revise_social_content_item(
  check_item uuid,
  check_caption text,
  check_media jsonb,
  check_scheduled_for timestamptz,
  check_creative_brief text
)
returns public.social_content_items
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.social_content_items;
  parent public.social_content_batches;
begin
  select * into target from public.social_content_items where id = check_item for update;
  if target.id is null then raise exception 'social content item not found' using errcode = 'P0002'; end if;
  select * into parent from public.social_content_batches where id = target.batch_id for update;
  if not public.has_product_role(parent.organization_id, 'social', array['manager', 'creator'], auth.uid()) then
    raise exception 'not authorized to revise social content' using errcode = '42501';
  end if;
  if parent.status not in ('internal_review', 'changes_requested') then
    raise exception 'content can only be revised during internal review or after changes are requested' using errcode = '55000';
  end if;
  if coalesce(length(trim(check_caption)), 0) = 0 or length(check_caption) > 10000 then
    raise exception 'caption is required and must not exceed 10000 characters' using errcode = '22023';
  end if;
  if jsonb_typeof(check_media) <> 'array' then raise exception 'media must be an array' using errcode = '22023'; end if;
  update public.social_content_items
    set caption = check_caption,
        media = check_media,
        scheduled_for = check_scheduled_for,
        creative_brief = coalesce(check_creative_brief, ''),
        shoutrrr_post_id = null,
        updated_at = now()
    where id = target.id returning * into target;
  insert into public.social_content_item_versions(
    social_content_item_id, revision, caption, media, scheduled_for, created_by
  ) values (
    target.id, target.current_revision, target.caption, target.media, target.scheduled_for, auth.uid()
  );
  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id, detail)
  values (parent.organization_id, auth.uid(), 'social_item.revised', 'social_content_item', target.id::text,
    jsonb_build_object('revision', target.current_revision));
  return target;
end;
$$;

create or replace function public.revise_social_content_day_media(
  check_batch uuid,
  check_content_day integer,
  check_media jsonb
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  parent public.social_content_batches;
  changed_count integer;
begin
  select * into parent from public.social_content_batches where id = check_batch for update;
  if parent.id is null then raise exception 'social content batch not found' using errcode = 'P0002'; end if;
  if not public.has_product_role(parent.organization_id, 'social', array['manager', 'creator'], auth.uid()) then
    raise exception 'not authorized to revise social content' using errcode = '42501';
  end if;
  if parent.status not in ('internal_review', 'changes_requested') then
    raise exception 'images can only be revised during internal review or after changes are requested' using errcode = '55000';
  end if;
  if check_content_day <= 0 then raise exception 'invalid content day' using errcode = '22023'; end if;
  if jsonb_typeof(check_media) <> 'array' or jsonb_array_length(check_media) = 0 then
    raise exception 'at least one approved image is required' using errcode = '22023';
  end if;
  update public.social_content_items
    set media = check_media, shoutrrr_post_id = null, updated_at = now()
    where batch_id = parent.id and content_day = check_content_day;
  get diagnostics changed_count = row_count;
  if changed_count <> 3 then
    raise exception 'a complete Facebook, Instagram, and LinkedIn day is required' using errcode = '55000';
  end if;
  insert into public.social_content_item_versions(
    social_content_item_id, revision, caption, media, scheduled_for, created_by
  ) select id, current_revision, caption, media, scheduled_for, auth.uid()
    from public.social_content_items
    where batch_id = parent.id and content_day = check_content_day;
  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id, detail)
  values (parent.organization_id, auth.uid(), 'social_day.media_revised', 'social_content_batch', parent.id::text,
    jsonb_build_object('content_day', check_content_day, 'platform_count', changed_count));
  return changed_count;
end;
$$;

create or replace function public.claim_social_batch_for_scheduling(check_batch uuid)
returns setof public.social_content_items
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.social_content_batches;
begin
  select * into target from public.social_content_batches where id = check_batch for update;
  if target.id is null then raise exception 'social content batch not found' using errcode = 'P0002'; end if;
  if not public.is_platform_admin(auth.uid()) then raise exception 'platform administrator required' using errcode = '42501'; end if;
  if target.status <> 'approved' or target.approved_approval_version is distinct from target.approval_version then
    raise exception 'the exact current batch has not been approved' using errcode = '55000';
  end if;
  if exists (
    select 1 from public.social_content_items
    where batch_id = target.id and approved_revision is distinct from current_revision
  ) then
    raise exception 'one or more posts changed after approval' using errcode = '55000';
  end if;
  update public.social_content_batches set status = 'scheduling', sync_error = null, updated_at = now()
    where id = target.id;
  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id)
  values (target.organization_id, auth.uid(), 'social_batch.scheduling_claimed', 'social_content_batch', target.id::text);
  return query select * from public.social_content_items where batch_id = target.id order by scheduled_for, platform;
end;
$$;

create or replace function public.record_social_item_shoutrrr_post(
  check_item uuid,
  check_post_id text
)
returns public.social_content_items
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.social_content_items;
  parent public.social_content_batches;
begin
  if coalesce(length(trim(check_post_id)), 0) = 0 then
    raise exception 'D2D Social post id is required' using errcode = '22023';
  end if;
  select * into target from public.social_content_items where id = check_item for update;
  if target.id is null then raise exception 'social content item not found' using errcode = 'P0002'; end if;
  select * into parent from public.social_content_batches where id = target.batch_id for update;
  if not public.is_platform_admin(auth.uid()) then raise exception 'platform administrator required' using errcode = '42501'; end if;
  if parent.status <> 'approved'
    or parent.approved_approval_version is distinct from parent.approval_version
    or target.approved_revision is distinct from target.current_revision then
    raise exception 'the exact current post has not been approved' using errcode = '55000';
  end if;
  if target.shoutrrr_post_id is not null and target.shoutrrr_post_id <> check_post_id then
    raise exception 'a different D2D Social draft is already linked' using errcode = '55000';
  end if;
  update public.social_content_items set shoutrrr_post_id = check_post_id, updated_at = now()
    where id = target.id returning * into target;
  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id, detail)
  values (parent.organization_id, auth.uid(), 'social_item.draft_linked', 'social_content_item', target.id::text,
    jsonb_build_object('shoutrrr_post_id', check_post_id));
  return target;
end;
$$;

create or replace function public.complete_social_batch_scheduling(
  check_batch uuid,
  check_succeeded boolean,
  check_error text default null
)
returns public.social_content_batches
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.social_content_batches;
begin
  select * into target from public.social_content_batches where id = check_batch for update;
  if target.id is null then raise exception 'social content batch not found' using errcode = 'P0002'; end if;
  if not public.is_platform_admin(auth.uid()) then raise exception 'platform administrator required' using errcode = '42501'; end if;
  if target.status <> 'scheduling' then raise exception 'batch has not been claimed for scheduling' using errcode = '55000'; end if;
  update public.social_content_batches
    set status = case when check_succeeded then 'scheduled' else 'failed' end,
        sync_error = case when check_succeeded then null else left(coalesce(check_error, 'Scheduling failed.'), 1000) end,
        updated_at = now()
    where id = target.id returning * into target;
  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id, detail)
  values (target.organization_id, auth.uid(),
    case when check_succeeded then 'social_batch.scheduled' else 'social_batch.scheduling_failed' end,
    'social_content_batch', target.id::text,
    jsonb_build_object('approval_version', target.approval_version, 'error', target.sync_error));
  return target;
end;
$$;

alter table public.product_entitlements enable row level security;
alter table public.organization_product_members enable row level security;
alter table public.marketing_plans enable row level security;
alter table public.marketing_plan_versions enable row level security;
alter table public.marketing_plan_reviews enable row level security;
alter table public.promotions enable row level security;
alter table public.social_content_batches enable row level security;
alter table public.social_content_items enable row level security;
alter table public.social_content_item_versions enable row level security;
alter table public.social_batch_reviews enable row level security;
alter table public.platform_audit_events enable row level security;

create policy product_entitlements_select on public.product_entitlements for select to authenticated
  using (public.has_product_role(organization_id, product, array['manager', 'creator', 'reviewer', 'viewer']));
create policy product_entitlements_admin_all on public.product_entitlements for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy organization_product_members_select on public.organization_product_members for select to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());
create policy organization_product_members_admin_all on public.organization_product_members for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy marketing_plans_select on public.marketing_plans for select to authenticated
  using (public.has_product_role(organization_id, 'social', array['manager', 'creator', 'reviewer', 'viewer']));
create policy marketing_plans_create on public.marketing_plans for insert to authenticated
  with check (created_by = auth.uid() and public.has_product_role(organization_id, 'social', array['manager', 'creator']));
create policy marketing_plans_update on public.marketing_plans for update to authenticated
  using (public.has_product_role(organization_id, 'social', array['manager', 'creator']))
  with check (public.has_product_role(organization_id, 'social', array['manager', 'creator']));

create policy marketing_plan_versions_select on public.marketing_plan_versions for select to authenticated
  using (exists (select 1 from public.marketing_plans p where p.id = marketing_plan_id));
create policy marketing_plan_versions_create on public.marketing_plan_versions for insert to authenticated
  with check (created_by = auth.uid() and exists (
    select 1 from public.marketing_plans p where p.id = marketing_plan_id
      and public.has_product_role(p.organization_id, 'social', array['manager', 'creator'])
  ));

create policy marketing_plan_reviews_select on public.marketing_plan_reviews for select to authenticated
  using (exists (select 1 from public.marketing_plans p where p.id = marketing_plan_id));

create policy promotions_select on public.promotions for select to authenticated
  using (public.has_product_role(organization_id, 'social', array['manager', 'creator', 'reviewer', 'viewer']));
create policy promotions_create on public.promotions for insert to authenticated
  with check (submitted_by = auth.uid() and public.has_product_role(organization_id, 'social', array['manager', 'creator', 'reviewer']));
create policy promotions_update on public.promotions for update to authenticated
  using (submitted_by = auth.uid() or public.has_product_role(organization_id, 'social', array['manager', 'creator']))
  with check (public.has_product_role(organization_id, 'social', array['manager', 'creator', 'reviewer']));

create policy social_batches_select on public.social_content_batches for select to authenticated
  using (public.has_product_role(organization_id, 'social', array['manager', 'creator', 'reviewer', 'viewer']));
create policy social_batches_create on public.social_content_batches for insert to authenticated
  with check (created_by = auth.uid() and public.has_product_role(organization_id, 'social', array['manager', 'creator']));
create policy social_batches_update on public.social_content_batches for update to authenticated
  using (public.has_product_role(organization_id, 'social', array['manager', 'creator']))
  with check (public.has_product_role(organization_id, 'social', array['manager', 'creator']));

create policy social_items_select on public.social_content_items for select to authenticated
  using (exists (select 1 from public.social_content_batches b where b.id = batch_id));
create policy social_items_create on public.social_content_items for insert to authenticated
  with check (created_by = auth.uid() and exists (
    select 1 from public.social_content_batches b where b.id = batch_id
      and public.has_product_role(b.organization_id, 'social', array['manager', 'creator'])
  ));
create policy social_items_update on public.social_content_items for update to authenticated
  using (exists (
    select 1 from public.social_content_batches b where b.id = batch_id
      and public.has_product_role(b.organization_id, 'social', array['manager', 'creator'])
  ))
  with check (exists (
    select 1 from public.social_content_batches b where b.id = batch_id
      and public.has_product_role(b.organization_id, 'social', array['manager', 'creator'])
  ));

create policy social_item_versions_select on public.social_content_item_versions for select to authenticated
  using (exists (select 1 from public.social_content_items i where i.id = social_content_item_id));
create policy social_item_versions_create on public.social_content_item_versions for insert to authenticated
  with check (created_by = auth.uid() and exists (
    select 1 from public.social_content_items i
    join public.social_content_batches b on b.id = i.batch_id
    where i.id = social_content_item_id
      and public.has_product_role(b.organization_id, 'social', array['manager', 'creator'])
  ));

create policy social_batch_reviews_select on public.social_batch_reviews for select to authenticated
  using (exists (select 1 from public.social_content_batches b where b.id = batch_id));

create policy platform_audit_events_select on public.platform_audit_events for select to authenticated
  using (public.is_platform_admin() or (
    organization_id is not null
    and public.has_product_role(organization_id, 'social', array['manager'])
  ));

revoke all on public.product_entitlements, public.organization_product_members,
  public.marketing_plans, public.marketing_plan_versions, public.marketing_plan_reviews,
  public.promotions, public.social_content_batches, public.social_content_items,
  public.social_content_item_versions, public.social_batch_reviews, public.platform_audit_events
  from anon, authenticated;

revoke execute on function public.sync_profile_from_auth_user() from public, anon, authenticated;
revoke execute on function public.has_product_role(uuid, text, text[], uuid) from public, anon, authenticated;
revoke execute on function public.admin_set_product_entitlement(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.admin_set_product_member(uuid, uuid, text, text) from public, anon, authenticated;
revoke execute on function public.prevent_immutable_marketing_records() from public, anon, authenticated;
revoke execute on function public.reset_social_approval_on_change() from public, anon, authenticated;
revoke execute on function public.create_marketing_plan_draft(uuid, text, date, date, text, jsonb) from public, anon, authenticated;
revoke execute on function public.submit_marketing_plan_for_review(uuid) from public, anon, authenticated;
revoke execute on function public.revise_marketing_plan(uuid, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.review_marketing_plan(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.create_social_batch_from_json(uuid, uuid, text, date, date, jsonb) from public, anon, authenticated;
revoke execute on function public.submit_social_batch_for_client_review(uuid) from public, anon, authenticated;
revoke execute on function public.revise_social_content_item(uuid, text, jsonb, timestamptz, text) from public, anon, authenticated;
revoke execute on function public.revise_social_content_day_media(uuid, integer, jsonb) from public, anon, authenticated;
revoke execute on function public.review_social_batch(uuid, text, text) from public, anon, authenticated;
revoke execute on function public.claim_social_batch_for_scheduling(uuid) from public, anon, authenticated;
revoke execute on function public.record_social_item_shoutrrr_post(uuid, text) from public, anon, authenticated;
revoke execute on function public.complete_social_batch_scheduling(uuid, boolean, text) from public, anon, authenticated;

grant select on public.product_entitlements, public.organization_product_members,
  public.marketing_plans, public.marketing_plan_versions, public.marketing_plan_reviews,
  public.promotions, public.social_content_batches, public.social_content_items,
  public.social_content_item_versions, public.social_batch_reviews, public.platform_audit_events
  to authenticated;

grant insert on public.promotions to authenticated;

grant select, insert, update, delete on public.product_entitlements, public.organization_product_members to authenticated;
grant execute on function public.has_product_role(uuid, text, text[], uuid) to authenticated;
grant execute on function public.admin_set_product_entitlement(uuid, text, text, text, text) to authenticated;
grant execute on function public.admin_set_product_member(uuid, uuid, text, text) to authenticated;
grant execute on function public.create_marketing_plan_draft(uuid, text, date, date, text, jsonb) to authenticated;
grant execute on function public.submit_marketing_plan_for_review(uuid) to authenticated;
grant execute on function public.revise_marketing_plan(uuid, text, text, jsonb) to authenticated;
grant execute on function public.review_marketing_plan(uuid, text, text) to authenticated;
grant execute on function public.create_social_batch_from_json(uuid, uuid, text, date, date, jsonb) to authenticated;
grant execute on function public.submit_social_batch_for_client_review(uuid) to authenticated;
grant execute on function public.revise_social_content_item(uuid, text, jsonb, timestamptz, text) to authenticated;
grant execute on function public.revise_social_content_day_media(uuid, integer, jsonb) to authenticated;
grant execute on function public.review_social_batch(uuid, text, text) to authenticated;
grant execute on function public.claim_social_batch_for_scheduling(uuid) to authenticated;
grant execute on function public.record_social_item_shoutrrr_post(uuid, text) to authenticated;
grant execute on function public.complete_social_batch_scheduling(uuid, boolean, text) to authenticated;

commit;
