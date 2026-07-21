begin;

-- Hosted projects can carry broad default table grants that differ from a
-- freshly initialized local stack. Reset the Site Manager base tables to an
-- explicit least-privilege baseline, then rely on RLS for row-level access.
revoke all privileges on table
  public.profiles,
  public.organizations,
  public.organization_members,
  public.sites,
  public.content_entries,
  public.content_versions,
  public.review_notes,
  public.media_assets,
  public.publish_events,
  public.site_invitations,
  public.redirects
from anon, authenticated;

grant usage on schema public to anon, authenticated;

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
