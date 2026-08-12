create table if not exists public.website_feedback_sessions (
  id uuid primary key default gen_random_uuid(),
  access_token_hash text not null unique,
  client_name text not null check (char_length(client_name) between 2 and 120),
  client_email text not null check (char_length(client_email) <= 240),
  company text not null check (char_length(company) between 2 and 180),
  initial_url text not null check (char_length(initial_url) <= 2048),
  source_site_slug text,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  satisfaction_score smallint check (satisfaction_score between 1 and 10),
  approval_status text check (approval_status in ('needs_revision', 'nearly_ready', 'approved')),
  overall_answers jsonb not null default '{}'::jsonb,
  email_sent_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.website_feedback_pages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.website_feedback_sessions(id) on delete cascade,
  url text not null check (char_length(url) <= 2048),
  page_title text not null default '' check (char_length(page_title) <= 240),
  page_score smallint not null check (page_score between 1 and 5),
  answers jsonb not null default '{}'::jsonb,
  commentary text not null default '' check (char_length(commentary) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, url)
);

create table if not exists public.website_feedback_altcha_uses (
  challenge_id text primary key,
  used_at timestamptz not null default now()
);

create index if not exists website_feedback_sessions_updated_idx on public.website_feedback_sessions(updated_at desc);
create index if not exists website_feedback_pages_session_idx on public.website_feedback_pages(session_id, updated_at);
create index if not exists website_feedback_altcha_used_idx on public.website_feedback_altcha_uses(used_at);

alter table public.website_feedback_sessions enable row level security;
alter table public.website_feedback_pages enable row level security;
alter table public.website_feedback_altcha_uses enable row level security;

revoke all on public.website_feedback_sessions from anon, authenticated;
revoke all on public.website_feedback_pages from anon, authenticated;
revoke all on public.website_feedback_altcha_uses from anon, authenticated;
grant all on public.website_feedback_sessions to service_role;
grant all on public.website_feedback_pages to service_role;
grant all on public.website_feedback_altcha_uses to service_role;
