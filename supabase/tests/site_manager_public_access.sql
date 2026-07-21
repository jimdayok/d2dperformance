-- Run only against a disposable local Supabase database.
-- Verify anon cannot read CMS base tables and can retrieve published content
-- only through the explicitly granted public RPC. Everything is rolled back.
begin;

insert into public.organizations(id, name, slug)
values ('40000000-0000-0000-0000-000000000001', 'Public RPC Test', 'public-rpc-test');

insert into public.sites(id, organization_id, name, slug, production_url, preview_url)
values (
  '50000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  'Public RPC Test Site',
  'public-rpc-test-site',
  'https://public-rpc.example.test',
  'https://public-rpc.example.test'
);

insert into public.content_entries(
  site_id,
  content_type,
  content_key,
  title,
  workflow_status,
  draft_data,
  published_data,
  published_revision,
  published_at
)
values
  (
    '50000000-0000-0000-0000-000000000001',
    'page',
    'draft-only',
    'Draft only',
    'draft',
    '{"heading":"Draft"}',
    null,
    null,
    null
  ),
  (
    '50000000-0000-0000-0000-000000000001',
    'page',
    'published',
    'Published',
    'published',
    '{"heading":"Published draft"}',
    '{"heading":"Published"}',
    1,
    now()
  );

set local role anon;

do $$
declare
  rpc_count integer;
  rpc_key text;
begin
  select count(*), min(content_key)
  into rpc_count, rpc_key
  from public.get_published_content('public-rpc-test-site');

  if rpc_count <> 1 or rpc_key <> 'published' then
    raise exception 'public RPC test failed: expected only the published entry';
  end if;

  begin
    perform 1 from public.content_entries;
    raise exception 'anonymous base-table read unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end
$$;

rollback;
