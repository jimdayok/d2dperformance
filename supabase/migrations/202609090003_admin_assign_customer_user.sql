begin;

create or replace function public.admin_assign_customer_user(
  check_organization uuid,
  check_user uuid,
  check_organization_role text,
  check_product_roles jsonb default '{}'::jsonb
)
returns public.organization_members
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.organization_members;
  product_name text;
  product_role text;
begin
  if not public.is_platform_admin(auth.uid()) then
    raise exception 'platform administrator required' using errcode = '42501';
  end if;
  if check_organization_role not in ('site_admin', 'publisher', 'editor', 'viewer') then
    raise exception 'invalid organization role' using errcode = '22023';
  end if;
  if not exists (select 1 from public.organizations where id = check_organization and status = 'active') then
    raise exception 'active customer organization not found' using errcode = 'P0002';
  end if;
  if not exists (select 1 from public.profiles where id = check_user) then
    raise exception 'D2D Account user not found' using errcode = 'P0002';
  end if;
  if jsonb_typeof(check_product_roles) <> 'object' then
    raise exception 'product access must be an object' using errcode = '22023';
  end if;

  for product_name, product_role in select key, value #>> '{}' from jsonb_each(check_product_roles)
  loop
    if product_name not in ('social', 'brand_vault', 'web_management')
      or product_role not in ('manager', 'creator', 'reviewer', 'viewer') then
      raise exception 'invalid product access assignment' using errcode = '22023';
    end if;
    if not exists (
      select 1 from public.product_entitlements
      where organization_id = check_organization and product = product_name and status = 'active'
    ) then
      raise exception 'turn on % for the customer before assigning it', product_name using errcode = '22023';
    end if;
  end loop;

  insert into public.organization_members(organization_id, user_id, role)
  values (check_organization, check_user, check_organization_role)
  on conflict (organization_id, user_id) do update
    set role = excluded.role, updated_at = now()
  returning * into target;

  insert into public.organization_product_members(organization_id, user_id, product, role)
  select check_organization, check_user, key, value #>> '{}'
  from jsonb_each(check_product_roles)
  on conflict (organization_id, user_id, product) do update
    set role = excluded.role, updated_at = now();

  insert into public.platform_audit_events(
    organization_id, actor_id, action, subject_type, subject_id, detail
  ) values (
    check_organization,
    auth.uid(),
    'organization_member.assigned',
    'profile',
    check_user::text,
    jsonb_build_object('organization_role', check_organization_role, 'product_roles', check_product_roles)
  );

  return target;
end;
$$;

revoke all on function public.admin_assign_customer_user(uuid, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.admin_assign_customer_user(uuid, uuid, text, jsonb) to authenticated;

commit;
