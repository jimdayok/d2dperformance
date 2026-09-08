begin;

-- Product-only customers must be able to read the organization attached to
-- their entitlement. Without this policy, the account dashboard can read the
-- membership and entitlement but drops the service when the organization row
-- is hidden by the website-membership-only policy.
drop policy if exists organizations_product_member_select on public.organizations;
create policy organizations_product_member_select
on public.organizations
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_product_members membership
    where membership.organization_id = organizations.id
      and membership.user_id = auth.uid()
  )
);

commit;
