-- Run against a disposable local Supabase database after the core migration.
-- The script switches to `authenticated`, so RLS is exercised rather than
-- accidentally bypassed by the migration owner. Everything is rolled back.
begin;

insert into auth.users(instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'rls-a@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'rls-b@example.test', '', now(), '{}', '{}', now(), now());
insert into public.profiles(id, email) values ('10000000-0000-0000-0000-000000000001', 'rls-a@example.test'), ('10000000-0000-0000-0000-000000000002', 'rls-b@example.test');
insert into public.organizations(id, name, slug) values ('20000000-0000-0000-0000-000000000001', 'RLS A', 'rls-a'), ('20000000-0000-0000-0000-000000000002', 'RLS B', 'rls-b');
insert into public.organization_members(organization_id, user_id, role) values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'editor'), ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'editor');
insert into public.sites(id, organization_id, name, slug, production_url, preview_url)
values ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Site A', 'rls-site-a', 'https://a.example.test', 'https://a.example.test'),
       ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Site B', 'rls-site-b', 'https://b.example.test', 'https://b.example.test');
insert into public.content_entries(site_id, content_type, content_key, title, draft_data)
values ('30000000-0000-0000-0000-000000000001', 'page', 'home', 'A', '{"heading":"A"}'),
       ('30000000-0000-0000-0000-000000000002', 'page', 'home', 'B', '{"heading":"B"}');

set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
set local request.jwt.claim.role = 'authenticated';

do $$
begin
  if (select count(*) from public.content_entries) <> 1 then
    raise exception 'tenant isolation failed: user A did not see exactly one entry';
  end if;
  if exists (select 1 from public.content_entries where site_id = '30000000-0000-0000-0000-000000000002') then
    raise exception 'tenant isolation failed: user A saw tenant B';
  end if;
  begin
    update public.content_entries set title = 'forbidden' where site_id = '30000000-0000-0000-0000-000000000002';
    if found then raise exception 'tenant isolation failed: cross-tenant update succeeded'; end if;
  end;
end $$;

rollback;
