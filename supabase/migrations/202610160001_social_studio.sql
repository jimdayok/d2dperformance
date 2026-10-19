begin;
create table public.social_studio_drafts (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 title text not null check(length(title) between 1 and 180), content jsonb not null default '{}'::jsonb,
 planned_for timestamptz, revision integer not null default 1, created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.social_studio_media (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 storage_path text not null unique, name text not null, mime_type text not null, created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
alter table public.social_studio_drafts enable row level security;
alter table public.social_studio_media enable row level security;
create policy studio_drafts_access on public.social_studio_drafts for all to authenticated using (public.has_product_role(organization_id,'social',array['manager','creator'],auth.uid())) with check (public.has_product_role(organization_id,'social',array['manager','creator'],auth.uid()));
create policy studio_media_access on public.social_studio_media for all to authenticated using (public.has_product_role(organization_id,'social',array['manager','creator'],auth.uid())) with check (public.has_product_role(organization_id,'social',array['manager','creator'],auth.uid()));
grant select,insert,update,delete on public.social_studio_drafts,public.social_studio_media to authenticated;
grant all on public.social_studio_drafts,public.social_studio_media to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('social-studio','social-studio',false,104857600,array['image/png','image/jpeg','image/webp','video/mp4','video/quicktime']) on conflict(id) do nothing;
commit;
