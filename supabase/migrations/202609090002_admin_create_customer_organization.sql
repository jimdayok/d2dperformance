begin;

create or replace function public.admin_create_customer_organization(
  check_name text,
  check_slug text
)
returns public.organizations
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  normalized_name text := trim(check_name);
  normalized_slug text := trim(check_slug);
  target public.organizations;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'platform administrator required' using errcode = '42501';
  end if;
  if char_length(normalized_name) not between 1 and 160 then
    raise exception 'customer name must be between 1 and 160 characters' using errcode = '22023';
  end if;
  if char_length(normalized_slug) not between 1 and 80
    or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'customer name must include at least one letter or number' using errcode = '22023';
  end if;
  if exists (
    select 1
    from public.organizations
    where lower(name) = lower(normalized_name) or slug = normalized_slug
  ) then
    raise exception 'a customer with this name already exists' using errcode = '23505';
  end if;

  insert into public.organizations(name, slug, status)
  values (normalized_name, normalized_slug, 'active')
  returning * into target;

  insert into public.platform_audit_events(
    organization_id,
    actor_id,
    action,
    subject_type,
    subject_id,
    detail
  ) values (
    target.id,
    auth.uid(),
    'organization.created',
    'organization',
    target.id::text,
    jsonb_build_object('name', target.name, 'slug', target.slug, 'initial_services', 'off')
  );

  return target;
end;
$$;

revoke all on function public.admin_create_customer_organization(text, text) from public, anon, authenticated;
grant execute on function public.admin_create_customer_organization(text, text) to authenticated;

commit;
