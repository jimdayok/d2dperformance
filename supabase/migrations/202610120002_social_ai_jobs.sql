create table if not exists public.social_ai_jobs (
 id uuid primary key,
 organization_id uuid not null references public.organizations(id),
 created_by uuid not null references public.profiles(id),
 status text not null check(status in ('processing','completed','failed')),
 batch_id uuid references public.social_content_batches(id),
 message text,
 brand_sources jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.social_ai_jobs enable row level security;
