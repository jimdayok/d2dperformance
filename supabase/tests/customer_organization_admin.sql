-- Verify that only a platform administrator can create a customer and that
-- every newly created customer begins with no enabled services.
begin;
select plan(1);

insert into auth.users(instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', '71000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin@example.test', '', now(), '{}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '71000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'customer@example.test', '', now(), '{}', '{}', now(), now());

update public.profiles
set is_platform_admin = true
where id = '71000000-0000-0000-0000-000000000001';

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000001', true);

do $$
declare
  created public.organizations;
begin
  select * into created
  from public.admin_create_customer_organization('Mike''s Off the Square', 'mikes-off-the-square');

  if created.name <> 'Mike''s Off the Square' or created.slug <> 'mikes-off-the-square' then
    raise exception 'the customer name or account name was not saved correctly';
  end if;
  if exists (select 1 from public.product_entitlements where organization_id = created.id) then
    raise exception 'a new customer unexpectedly received service access';
  end if;
  if not exists (
    select 1 from public.platform_audit_events
    where organization_id = created.id and action = 'organization.created'
  ) then
    raise exception 'customer creation was not recorded in the audit log';
  end if;

  perform set_config('request.jwt.claim.sub', '71000000-0000-0000-0000-000000000002', true);
  begin
    perform public.admin_create_customer_organization('Unauthorized Customer', 'unauthorized-customer');
    raise exception 'a non-administrator unexpectedly created a customer';
  exception when insufficient_privilege then null;
  end;
end $$;

select pass('customer creation is audited, default-off, and restricted to platform administrators');
select * from finish();

rollback;
