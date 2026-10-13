-- One-use private owner handoffs. Public/client roles have no access.
create table if not exists public.d2d_hub_used_tickets (
 id uuid primary key,
 audience text not null,
 consumed_at timestamptz not null default now()
);
create index if not exists d2d_hub_used_tickets_consumed_at_idx on public.d2d_hub_used_tickets(consumed_at);
alter table public.d2d_hub_used_tickets enable row level security;
revoke all on public.d2d_hub_used_tickets from anon, authenticated;
grant insert, select, delete on public.d2d_hub_used_tickets to service_role;
