begin;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  email text not null,
  is_platform_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('site_admin', 'publisher', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists organization_members_user_idx on public.organization_members(user_id);

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null check (length(name) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  production_url text not null check (production_url ~ '^https://'),
  preview_url text not null check (preview_url ~ '^https?://'),
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  publishing_mode text not null default 'approval_required' check (publishing_mode in ('approval_required', 'client_can_publish')),
  config jsonb not null default '{}'::jsonb check (jsonb_typeof(config) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sites_organization_idx on public.sites(organization_id);

create table if not exists public.content_entries (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete restrict,
  content_type text not null check (content_type ~ '^[a-z][a-z0-9_]{0,79}$'),
  content_key text not null check (length(content_key) between 1 and 180),
  title text not null check (length(title) between 1 and 240),
  slug text,
  workflow_status text not null default 'draft' check (workflow_status in ('draft', 'in_review', 'changes_requested', 'published', 'archived')),
  draft_data jsonb not null check (jsonb_typeof(draft_data) = 'object'),
  published_data jsonb check (published_data is null or jsonb_typeof(published_data) = 'object'),
  draft_revision integer not null default 1 check (draft_revision > 0),
  published_revision integer check (published_revision is null or published_revision > 0),
  updated_by uuid references public.profiles(id) on delete set null,
  published_by uuid references public.profiles(id) on delete set null,
  submitted_for_review_by uuid references public.profiles(id) on delete set null,
  submitted_for_review_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (site_id, content_type, content_key),
  unique (site_id, content_type, slug)
);

create index if not exists content_entries_site_status_idx on public.content_entries(site_id, workflow_status) where deleted_at is null;
create index if not exists content_entries_slug_idx on public.content_entries(site_id, slug) where slug is not null and deleted_at is null;

create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  content_entry_id uuid not null references public.content_entries(id) on delete restrict,
  revision integer not null check (revision > 0),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  action text not null check (action in ('created', 'draft_saved', 'submitted', 'changes_requested', 'published', 'restored', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (content_entry_id, revision, action)
);

create index if not exists content_versions_entry_idx on public.content_versions(content_entry_id, created_at desc);

create table if not exists public.review_notes (
  id uuid primary key default gen_random_uuid(),
  content_entry_id uuid not null references public.content_entries(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  note text not null check (length(note) between 1 and 5000),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  check ((resolved_at is null and resolved_by is null) or (resolved_at is not null and resolved_by is not null))
);

create index if not exists review_notes_entry_idx on public.review_notes(content_entry_id, created_at desc);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete restrict,
  source_kind text not null check (source_kind in ('legacy_local', 'supabase_draft', 'supabase_public')),
  storage_bucket text,
  storage_path text,
  legacy_path text,
  original_filename text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size bigint not null check (byte_size >= 0 and byte_size <= 20971520),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  alt_text text not null default '',
  caption text,
  is_decorative boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (
    (source_kind = 'legacy_local' and legacy_path is not null and storage_bucket is null and storage_path is null)
    or
    (source_kind <> 'legacy_local' and legacy_path is null and storage_bucket is not null and storage_path is not null)
  ),
  check (is_decorative or length(trim(alt_text)) > 0),
  unique (site_id, storage_bucket, storage_path),
  unique (site_id, legacy_path)
);

create index if not exists media_assets_site_idx on public.media_assets(site_id, created_at desc) where deleted_at is null;

create table if not exists public.publish_events (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete restrict,
  content_entry_id uuid not null references public.content_entries(id) on delete restrict,
  revision integer not null check (revision > 0),
  requested_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  target_url text not null check (target_url ~ '^https://'),
  http_status integer check (http_status is null or http_status between 100 and 599),
  response_summary text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists publish_events_site_idx on public.publish_events(site_id, created_at desc);

create table if not exists public.site_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null check (role in ('site_admin', 'publisher', 'editor', 'viewer')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index if not exists site_invitations_org_email_idx on public.site_invitations(organization_id, lower(email));

create table if not exists public.redirects (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  source_path text not null check (source_path ~ '^/' and source_path !~ '^//'),
  destination_path text not null check (destination_path ~ '^/' and destination_path !~ '^//'),
  status_code integer not null default 301 check (status_code in (301, 302, 307, 308)),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (source_path <> destination_path),
  unique (site_id, source_path)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger organizations_set_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger organization_members_set_updated_at before update on public.organization_members for each row execute function public.set_updated_at();
create trigger sites_set_updated_at before update on public.sites for each row execute function public.set_updated_at();
create trigger content_entries_set_updated_at before update on public.content_entries for each row execute function public.set_updated_at();
create trigger media_assets_set_updated_at before update on public.media_assets for each row execute function public.set_updated_at();

create or replace function public.prevent_content_version_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception 'content versions are immutable' using errcode = '55000';
end;
$$;

create trigger content_versions_immutable before update or delete on public.content_versions for each row execute function public.prevent_content_version_mutation();

create or replace function public.is_platform_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce((select p.is_platform_admin from public.profiles p where p.id = check_user), false)
$$;

create or replace function public.is_organization_member(check_organization uuid, check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.is_platform_admin(check_user)
    or exists (
      select 1 from public.organization_members m
      where m.organization_id = check_organization and m.user_id = check_user
    )
$$;

create or replace function public.has_site_role(check_site uuid, allowed_roles text[], check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.is_platform_admin(check_user)
    or exists (
      select 1
      from public.sites s
      join public.organization_members m on m.organization_id = s.organization_id
      where s.id = check_site and m.user_id = check_user and m.role = any(allowed_roles)
    )
$$;

create or replace function public.has_organization_role(check_organization uuid, allowed_roles text[], check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.is_platform_admin(check_user)
    or exists (
      select 1 from public.organization_members m
      where m.organization_id = check_organization and m.user_id = check_user and m.role = any(allowed_roles)
    )
$$;

create or replace function public.can_publish_site(check_site uuid, check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.is_platform_admin(check_user)
    or exists (
      select 1
      from public.sites s
      join public.organization_members m on m.organization_id = s.organization_id
      where s.id = check_site
        and m.user_id = check_user
        and (m.role = 'publisher' or (m.role = 'site_admin' and s.publishing_mode = 'client_can_publish'))
    )
$$;

revoke all on function public.is_platform_admin(uuid) from public;
revoke all on function public.is_organization_member(uuid, uuid) from public;
revoke all on function public.has_site_role(uuid, text[], uuid) from public;
revoke all on function public.has_organization_role(uuid, text[], uuid) from public;
revoke all on function public.can_publish_site(uuid, uuid) from public;
grant execute on function public.is_platform_admin(uuid) to authenticated, service_role;
grant execute on function public.is_organization_member(uuid, uuid) to authenticated, service_role;
grant execute on function public.has_site_role(uuid, text[], uuid) to authenticated, service_role;
grant execute on function public.has_organization_role(uuid, text[], uuid) to authenticated, service_role;
grant execute on function public.can_publish_site(uuid, uuid) to authenticated, service_role;

create or replace function public.save_content_draft(
  entry_id uuid,
  expected_revision integer,
  next_data jsonb,
  next_title text,
  next_slug text default null
)
returns public.content_entries
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  current_entry public.content_entries;
  saved_entry public.content_entries;
begin
  if jsonb_typeof(next_data) <> 'object' then
    raise exception 'draft data must be an object' using errcode = '22023';
  end if;

  select * into current_entry from public.content_entries where id = entry_id and deleted_at is null for update;
  if not found then raise exception 'content entry not found' using errcode = 'P0002'; end if;
  if not public.has_site_role(current_entry.site_id, array['editor','publisher','site_admin']) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if current_entry.draft_revision <> expected_revision then
    raise exception 'draft revision conflict' using errcode = '40001';
  end if;

  update public.content_entries
    set draft_data = next_data,
        title = next_title,
        slug = next_slug,
        draft_revision = draft_revision + 1,
        workflow_status = case when workflow_status = 'in_review' then 'draft' else workflow_status end,
        updated_by = auth.uid()
    where id = entry_id
    returning * into saved_entry;

  insert into public.content_versions(content_entry_id, revision, data, action, created_by)
  values (entry_id, saved_entry.draft_revision, saved_entry.draft_data, 'draft_saved', auth.uid());
  return saved_entry;
end;
$$;

create or replace function public.submit_content_for_review(entry_id uuid, expected_revision integer)
returns public.content_entries
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  current_entry public.content_entries;
  submitted_entry public.content_entries;
begin
  select * into current_entry from public.content_entries where id = entry_id and deleted_at is null for update;
  if not found then raise exception 'content entry not found' using errcode = 'P0002'; end if;
  if not public.has_site_role(current_entry.site_id, array['editor','publisher','site_admin']) then raise exception 'not authorized' using errcode = '42501'; end if;
  if current_entry.draft_revision <> expected_revision then raise exception 'draft revision conflict' using errcode = '40001'; end if;

  update public.content_entries set
    workflow_status = 'in_review', submitted_for_review_by = auth.uid(), submitted_for_review_at = now(), updated_by = auth.uid()
  where id = entry_id returning * into submitted_entry;

  insert into public.content_versions(content_entry_id, revision, data, action, created_by)
  values (entry_id, submitted_entry.draft_revision, submitted_entry.draft_data, 'submitted', auth.uid());
  return submitted_entry;
end;
$$;

create or replace function public.publish_content_entry(entry_id uuid, expected_draft_revision integer)
returns table (entry public.content_entries, event public.publish_events)
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  current_entry public.content_entries;
  current_site public.sites;
  published_entry public.content_entries;
  created_event public.publish_events;
begin
  select * into current_entry from public.content_entries where id = entry_id and deleted_at is null for update;
  if not found then raise exception 'content entry not found' using errcode = 'P0002'; end if;
  if not public.can_publish_site(current_entry.site_id) then raise exception 'not authorized to publish' using errcode = '42501'; end if;
  if current_entry.draft_revision <> expected_draft_revision then raise exception 'draft revision conflict' using errcode = '40001'; end if;
  if current_entry.workflow_status <> 'in_review' then raise exception 'content must be in review' using errcode = '22023'; end if;
  select * into current_site from public.sites where id = current_entry.site_id;

  update public.content_entries set
    published_data = draft_data,
    published_revision = coalesce(published_revision, 0) + 1,
    workflow_status = 'published',
    published_by = auth.uid(),
    published_at = now(),
    updated_by = auth.uid()
  where id = entry_id returning * into published_entry;

  insert into public.content_versions(content_entry_id, revision, data, action, created_by)
  values (entry_id, published_entry.draft_revision, published_entry.published_data, 'published', auth.uid());

  insert into public.publish_events(site_id, content_entry_id, revision, requested_by, target_url)
  values (published_entry.site_id, entry_id, published_entry.published_revision, auth.uid(), current_site.preview_url || '/api/cms/revalidate')
  returning * into created_event;
  return query select published_entry, created_event;
end;
$$;

revoke all on function public.save_content_draft(uuid, integer, jsonb, text, text) from public;
revoke all on function public.submit_content_for_review(uuid, integer) from public;
revoke all on function public.publish_content_entry(uuid, integer) from public;
grant execute on function public.save_content_draft(uuid, integer, jsonb, text, text) to authenticated;
grant execute on function public.submit_content_for_review(uuid, integer) to authenticated;
grant execute on function public.publish_content_entry(uuid, integer) to authenticated;

create or replace function public.get_published_content(
  requested_site_slug text,
  requested_content_type text default null,
  requested_content_key text default null
)
returns table (
  site_slug text,
  content_type text,
  content_key text,
  published_data jsonb,
  published_revision integer,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select s.slug, e.content_type, e.content_key, e.published_data, e.published_revision, e.published_at
  from public.content_entries e
  join public.sites s on s.id = e.site_id
  where requested_site_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    and s.slug = requested_site_slug
    and s.status = 'active'
    and e.deleted_at is null
    and e.published_data is not null
    and (requested_content_type is null or e.content_type = requested_content_type)
    and (requested_content_key is null or e.content_key = requested_content_key)
  order by e.content_type, e.content_key
$$;

revoke all on function public.get_published_content(text, text, text) from public;
grant execute on function public.get_published_content(text, text, text) to anon, authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.sites enable row level security;
alter table public.content_entries enable row level security;
alter table public.content_versions enable row level security;
alter table public.review_notes enable row level security;
alter table public.media_assets enable row level security;
alter table public.publish_events enable row level security;
alter table public.site_invitations enable row level security;
alter table public.redirects enable row level security;

create policy profiles_select_self_or_admin on public.profiles for select to authenticated using (id = auth.uid() or public.is_platform_admin());
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and is_platform_admin = public.is_platform_admin(auth.uid()));

create policy organizations_member_select on public.organizations for select to authenticated using (public.is_organization_member(id));
create policy organizations_admin_write on public.organizations for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy members_member_select on public.organization_members for select to authenticated using (public.is_organization_member(organization_id));
create policy members_site_admin_insert on public.organization_members for insert to authenticated with check (
  public.has_organization_role(organization_id, array['site_admin'])
);
create policy members_site_admin_update on public.organization_members for update to authenticated using (
  public.has_organization_role(organization_id, array['site_admin'])
) with check (role in ('site_admin','publisher','editor','viewer'));
create policy members_site_admin_delete on public.organization_members for delete to authenticated using (
  public.has_organization_role(organization_id, array['site_admin'])
);

create policy sites_member_select on public.sites for select to authenticated using (public.is_organization_member(organization_id));
create policy sites_platform_admin_write on public.sites for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy entries_assigned_select on public.content_entries for select to authenticated using (public.has_site_role(site_id, array['viewer','editor','publisher','site_admin']));
create policy entries_editor_insert on public.content_entries for insert to authenticated with check (public.has_site_role(site_id, array['editor','publisher','site_admin']));
create policy entries_editor_update on public.content_entries for update to authenticated using (public.has_site_role(site_id, array['editor','publisher','site_admin'])) with check (public.has_site_role(site_id, array['editor','publisher','site_admin']));
create policy entries_admin_delete on public.content_entries for delete to authenticated using (public.is_platform_admin());

create policy versions_assigned_select on public.content_versions for select to authenticated using (
  exists (select 1 from public.content_entries e where e.id = content_entry_id and public.has_site_role(e.site_id, array['viewer','editor','publisher','site_admin']))
);
create policy versions_editor_insert on public.content_versions for insert to authenticated with check (
  exists (select 1 from public.content_entries e where e.id = content_entry_id and public.has_site_role(e.site_id, array['editor','publisher','site_admin']))
);

create policy notes_assigned_select on public.review_notes for select to authenticated using (
  exists (select 1 from public.content_entries e where e.id = content_entry_id and public.has_site_role(e.site_id, array['viewer','editor','publisher','site_admin']))
);
create policy notes_editor_insert on public.review_notes for insert to authenticated with check (
  author_id = auth.uid() and exists (select 1 from public.content_entries e where e.id = content_entry_id and public.has_site_role(e.site_id, array['editor','publisher','site_admin']))
);
create policy notes_reviewer_update on public.review_notes for update to authenticated using (
  exists (select 1 from public.content_entries e where e.id = content_entry_id and (public.can_publish_site(e.site_id) or public.is_platform_admin()))
);

create policy media_assigned_select on public.media_assets for select to authenticated using (public.has_site_role(site_id, array['viewer','editor','publisher','site_admin']));
create policy media_editor_insert on public.media_assets for insert to authenticated with check (public.has_site_role(site_id, array['editor','publisher','site_admin']) and created_by = auth.uid());
create policy media_editor_update on public.media_assets for update to authenticated using (public.has_site_role(site_id, array['editor','publisher','site_admin'])) with check (public.has_site_role(site_id, array['editor','publisher','site_admin']));

create policy publish_events_assigned_select on public.publish_events for select to authenticated using (public.has_site_role(site_id, array['viewer','editor','publisher','site_admin']));
create policy publish_events_publisher_write on public.publish_events for all to authenticated using (public.can_publish_site(site_id)) with check (public.can_publish_site(site_id));

create policy invitations_member_select on public.site_invitations for select to authenticated using (public.is_organization_member(organization_id));
create policy invitations_site_admin_write on public.site_invitations for all to authenticated using (
  public.has_organization_role(organization_id, array['site_admin'])
) with check (
  invited_by = auth.uid() and public.has_organization_role(organization_id, array['site_admin'])
);

create policy redirects_assigned_select on public.redirects for select to authenticated using (public.has_site_role(site_id, array['viewer','editor','publisher','site_admin']));
create policy redirects_publisher_write on public.redirects for all to authenticated using (public.can_publish_site(site_id)) with check (public.can_publish_site(site_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('site-manager-drafts', 'site-manager-drafts', false, 20971520, array['image/jpeg','image/png','image/webp']),
  ('site-manager-public', 'site-manager-public', true, 20971520, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy site_manager_public_read on storage.objects for select to anon, authenticated using (bucket_id = 'site-manager-public');
create policy site_manager_member_read on storage.objects for select to authenticated using (
  bucket_id in ('site-manager-drafts','site-manager-public')
  and public.has_site_role(((storage.foldername(name))[1])::uuid, array['viewer','editor','publisher','site_admin'])
);
create policy site_manager_editor_insert on storage.objects for insert to authenticated with check (
  bucket_id in ('site-manager-drafts','site-manager-public')
  and public.has_site_role(((storage.foldername(name))[1])::uuid, array['editor','publisher','site_admin'])
);
create policy site_manager_editor_update on storage.objects for update to authenticated using (
  bucket_id in ('site-manager-drafts','site-manager-public')
  and public.has_site_role(((storage.foldername(name))[1])::uuid, array['editor','publisher','site_admin'])
);
create policy site_manager_editor_delete on storage.objects for delete to authenticated using (
  bucket_id in ('site-manager-drafts','site-manager-public')
  and public.has_site_role(((storage.foldername(name))[1])::uuid, array['editor','publisher','site_admin'])
);

commit;
