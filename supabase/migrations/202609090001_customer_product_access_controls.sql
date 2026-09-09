begin;

-- Preserve every existing Website Management customer's current access before
-- the new central product controls become the authorization gate.
insert into public.product_entitlements (organization_id, product, status, launch_url)
select distinct sites.organization_id, 'web_management', 'active', 'https://webadmin.d2dmktg.com/portal/dashboard'
from public.sites
where sites.status = 'active'
on conflict (organization_id, product) do nothing;

insert into public.organization_product_members (organization_id, user_id, product, role)
select distinct
  members.organization_id,
  members.user_id,
  'web_management',
  case members.role
    when 'site_admin' then 'manager'
    when 'publisher' then 'creator'
    when 'editor' then 'creator'
    else 'viewer'
  end
from public.organization_members members
where exists (
  select 1 from public.sites
  where sites.organization_id = members.organization_id and sites.status = 'active'
)
on conflict (organization_id, user_id, product) do nothing;

-- Make the central Web Management assignment part of the existing database
-- authorization checks, so direct requests cannot bypass the portal buttons.
create or replace function public.has_site_role(check_site uuid, allowed_roles text[], check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.is_platform_admin(check_user)
    or (
      exists (
        select 1
        from public.sites s
        join public.organization_members m on m.organization_id = s.organization_id
        where s.id = check_site and m.user_id = check_user and m.role = any(allowed_roles)
      )
      and exists (
        select 1
        from public.sites s
        where s.id = check_site
          and public.has_product_role(s.organization_id, 'web_management', array['manager', 'creator', 'reviewer', 'viewer'], check_user)
      )
    )
$$;

create or replace function public.has_organization_role(check_organization uuid, allowed_roles text[], check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.is_platform_admin(check_user)
    or (
      exists (
        select 1 from public.organization_members m
        where m.organization_id = check_organization and m.user_id = check_user and m.role = any(allowed_roles)
      )
      and public.has_product_role(check_organization, 'web_management', array['manager', 'creator', 'reviewer', 'viewer'], check_user)
    )
$$;

create or replace function public.can_publish_site(check_site uuid, check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select public.is_platform_admin(check_user)
    or (
      exists (
        select 1
        from public.sites s
        join public.organization_members m on m.organization_id = s.organization_id
        where s.id = check_site
          and m.user_id = check_user
          and (m.role = 'publisher' or (m.role = 'site_admin' and s.publishing_mode = 'client_can_publish'))
      )
      and exists (
        select 1
        from public.sites s
        where s.id = check_site
          and public.has_product_role(s.organization_id, 'web_management', array['manager', 'creator'], check_user)
      )
    )
$$;

create or replace function public.admin_set_product_member(
  check_organization uuid,
  check_user uuid,
  check_product text,
  check_role text
)
returns public.organization_product_members
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.organization_product_members;
begin
  if not public.is_platform_admin(auth.uid()) then raise exception 'platform administrator required' using errcode = '42501'; end if;
  if check_product not in ('social', 'brand_vault', 'web_management') then raise exception 'invalid product' using errcode = '22023'; end if;
  if check_role not in ('manager', 'creator', 'reviewer', 'viewer') then raise exception 'invalid product role' using errcode = '22023'; end if;
  if not exists (
    select 1 from public.organization_members
    where organization_id = check_organization and user_id = check_user
  ) then raise exception 'person must belong to the organization before product access can be assigned' using errcode = '55000'; end if;
  if not exists (
    select 1 from public.product_entitlements
    where organization_id = check_organization and product = check_product and status = 'active'
  ) then raise exception 'activate the product entitlement before adding a member' using errcode = '55000'; end if;
  insert into public.organization_product_members(organization_id, user_id, product, role)
  values (check_organization, check_user, check_product, check_role)
  on conflict (organization_id, user_id, product) do update
    set role = excluded.role, updated_at = now()
  returning * into target;
  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id, detail)
  values (check_organization, auth.uid(), 'product_member.set', 'organization_product_member', target.id::text,
    jsonb_build_object('product', target.product, 'role', target.role, 'user_id', target.user_id));
  return target;
end;
$$;

create or replace function public.admin_remove_product_member(
  check_organization uuid,
  check_user uuid,
  check_product text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  target public.organization_product_members;
begin
  if not public.is_platform_admin(auth.uid()) then raise exception 'platform administrator required' using errcode = '42501'; end if;
  if check_product not in ('social', 'brand_vault', 'web_management') then raise exception 'invalid product' using errcode = '22023'; end if;
  delete from public.organization_product_members
  where organization_id = check_organization and user_id = check_user and product = check_product
  returning * into target;
  if target.id is null then return false; end if;
  insert into public.platform_audit_events(organization_id, actor_id, action, subject_type, subject_id, detail)
  values (check_organization, auth.uid(), 'product_member.removed', 'organization_product_member', target.id::text,
    jsonb_build_object('product', target.product, 'role', target.role, 'user_id', target.user_id));
  return true;
end;
$$;

revoke all on function public.admin_set_product_member(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_remove_product_member(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.admin_set_product_member(uuid, uuid, text, text) to authenticated;
grant execute on function public.admin_remove_product_member(uuid, uuid, text) to authenticated;

commit;
