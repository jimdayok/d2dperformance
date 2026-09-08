import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/site-manager/access";
import type { D2DProduct, ProductAccess, ProductRole } from "@/lib/d2d-platform/types";

type MembershipRow = {
  organization_id: string;
  product: D2DProduct;
  role: ProductRole;
};

type EntitlementRow = {
  organization_id: string;
  product: D2DProduct;
  launch_url: string;
};

type OrganizationRow = { id: string; name: string; slug: string };

export const getPlatformAdminStatus = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return false;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("is_platform_admin").eq("id", user.id).single();
  return Boolean(data?.is_platform_admin);
});

export const getProductAccess = cache(async (): Promise<ProductAccess[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createSupabaseServerClient();
  const [isPlatformAdmin, { data: memberships }] = await Promise.all([
    getPlatformAdminStatus(),
    supabase.from("organization_product_members")
      .select("organization_id,product,role")
      .eq("user_id", user.id),
  ]);
  const typedMemberships = (memberships ?? []) as MembershipRow[];
  let entitlementQuery = supabase.from("product_entitlements")
    .select("organization_id,product,launch_url")
    .eq("status", "active");
  if (!isPlatformAdmin) {
    const organizationIds = [...new Set(typedMemberships.map((row) => row.organization_id))];
    if (organizationIds.length === 0) return [];
    entitlementQuery = entitlementQuery.in("organization_id", organizationIds);
  }
  const { data: entitlements } = await entitlementQuery;
  const typedEntitlements = (entitlements ?? []) as EntitlementRow[];
  const organizationIds = [...new Set(typedEntitlements.map((row) => row.organization_id))];
  if (organizationIds.length === 0) return [];
  const { data: organizations } = await supabase.from("organizations")
    .select("id,name,slug")
    .in("id", organizationIds)
    .eq("status", "active");
  const organizationMap = new Map(
    ((organizations ?? []) as OrganizationRow[]).map((row) => [row.id, row]),
  );
  return typedEntitlements.flatMap((entitlement) => {
    const organization = organizationMap.get(entitlement.organization_id);
    const membership = typedMemberships.find((row) =>
      row.organization_id === entitlement.organization_id && row.product === entitlement.product);
    if (!organization || (!isPlatformAdmin && !membership)) return [];
    return [{
      organizationId: organization.id,
      organizationName: organization.name,
      organizationSlug: organization.slug,
      product: entitlement.product,
      role: isPlatformAdmin ? "platform_admin" : membership!.role,
      launchUrl: entitlement.launch_url,
    } satisfies ProductAccess];
  });
});

export async function requireProductAccess(
  organizationId: string,
  product: D2DProduct,
  allowedRoles: ProductRole[],
) {
  const access = (await getProductAccess()).find((row) =>
    row.organizationId === organizationId
    && row.product === product
    && (row.role === "platform_admin" || allowedRoles.includes(row.role)));
  if (!access) throw new Error("You do not have permission to perform this action.");
  return access;
}
