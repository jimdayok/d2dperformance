begin;

-- RLS policies are evaluated only after PostgreSQL's base table privileges.
-- Grant authenticated users the operations that the Site Manager policies
-- already authorize, while keeping CMS base tables inaccessible to anon.
grant usage on schema public to authenticated;

grant select, update on table public.profiles to authenticated;

grant select, insert, update, delete on table public.organizations to authenticated;
grant select, insert, update, delete on table public.organization_members to authenticated;
grant select, insert, update, delete on table public.sites to authenticated;
grant select, insert, update, delete on table public.content_entries to authenticated;

grant select, insert on table public.content_versions to authenticated;
grant select, insert, update on table public.review_notes to authenticated;
grant select, insert, update on table public.media_assets to authenticated;

grant select, insert, update, delete on table public.publish_events to authenticated;
grant select, insert, update, delete on table public.site_invitations to authenticated;
grant select, insert, update, delete on table public.redirects to authenticated;

commit;
