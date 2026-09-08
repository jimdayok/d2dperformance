begin;

do $$
declare
  d2d_organization_id uuid;
begin
  insert into public.organizations (name, slug, status)
  values ('D2D Marketing', 'd2d-marketing', 'active')
  on conflict (slug) do update
    set name = excluded.name,
        status = excluded.status,
        updated_at = now()
  returning id into d2d_organization_id;

  update public.profiles
  set is_platform_admin = true,
      updated_at = now()
  where lower(email) in ('jim@d2dmktg.com', 'andrea@d2dmktg.com');

  insert into public.organization_members (organization_id, user_id, role)
  select d2d_organization_id, id, 'site_admin'
  from public.profiles
  where lower(email) in ('jim@d2dmktg.com', 'andrea@d2dmktg.com')
  on conflict (organization_id, user_id) do update
    set role = excluded.role,
        updated_at = now();

  insert into public.product_entitlements (
    organization_id,
    product,
    status,
    launch_url,
    external_workspace_id
  )
  values
    (
      d2d_organization_id,
      'social',
      'active',
      'https://webadmin.d2dmktg.com/portal/marketing',
      '01a07ce3-499d-7074-ae8d-95128adc76f5'
    ),
    (
      d2d_organization_id,
      'brand_vault',
      'active',
      'https://brandvault.d2dmktg.com/app/d2dmktg',
      null
    ),
    (
      d2d_organization_id,
      'web_management',
      'active',
      'https://webadmin.d2dmktg.com/portal/dashboard',
      null
    )
  on conflict (organization_id, product) do update
    set status = excluded.status,
        launch_url = excluded.launch_url,
        external_workspace_id = excluded.external_workspace_id,
        updated_at = now();

  insert into public.organization_product_members (
    organization_id,
    user_id,
    product,
    role
  )
  select d2d_organization_id, profiles.id, products.product, 'manager'
  from public.profiles
  cross join (
    values ('social'), ('brand_vault'), ('web_management')
  ) as products(product)
  where lower(profiles.email) in ('jim@d2dmktg.com', 'andrea@d2dmktg.com')
  on conflict (organization_id, user_id, product) do update
    set role = excluded.role,
        updated_at = now();
end;
$$;

commit;
