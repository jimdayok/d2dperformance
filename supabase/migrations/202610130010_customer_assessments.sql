create table if not exists public.d2d_customer_profiles (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid unique references public.organizations(id),
 name text not null,
 website text not null default '',
 created_at timestamptz not null default now()
);
create table if not exists public.d2d_customer_assessments (
 id uuid primary key default gen_random_uuid(),
 customer_profile_id uuid not null references public.d2d_customer_profiles(id),
 title text not null,
 status text not null default 'draft' check (status in ('draft','queued','investigating','blocked','completed')),
 published boolean not null default false,
 method text not null default 'D2D AI Visibility v3.0 + homepage SEO baseline',
 data jsonb not null default '{}',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.d2d_customer_profiles enable row level security;
alter table public.d2d_customer_assessments enable row level security;
do $$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='d2d_customer_profiles' and policyname='customer profiles scoped read') then execute $policy$create policy "customer profiles scoped read" on public.d2d_customer_profiles for select to authenticated using (
 exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_platform_admin)
 or exists(select 1 from public.organization_members m where m.user_id=auth.uid() and m.organization_id=d2d_customer_profiles.organization_id)
);$policy$; end if; end $$;
do $$ begin if not exists(select 1 from pg_policies where schemaname='public' and tablename='d2d_customer_assessments' and policyname='customer assessment scoped published read') then execute $policy$create policy "customer assessment scoped published read" on public.d2d_customer_assessments for select to authenticated using (
 exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_platform_admin)
 or (published and exists(select 1 from public.d2d_customer_profiles c join public.organization_members m on m.organization_id=c.organization_id where c.id=d2d_customer_assessments.customer_profile_id and m.user_id=auth.uid()))
);$policy$; end if; end $$;
revoke all on public.d2d_customer_profiles,public.d2d_customer_assessments from anon;
revoke insert,update,delete on public.d2d_customer_profiles,public.d2d_customer_assessments from authenticated;
grant select on public.d2d_customer_profiles,public.d2d_customer_assessments to authenticated;
grant all on public.d2d_customer_profiles,public.d2d_customer_assessments to service_role;
alter table public.d2d_quotes add column if not exists customer_profile_id uuid references public.d2d_customer_profiles(id);
insert into public.d2d_customer_profiles(organization_id,name,website)
 select o.id,o.name,coalesce((select s.production_url from public.sites s where s.organization_id=o.id order by s.created_at limit 1),'')
 from public.organizations o on conflict(organization_id) do nothing;
