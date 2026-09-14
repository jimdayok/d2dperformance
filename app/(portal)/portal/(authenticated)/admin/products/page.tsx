import { redirect } from "next/navigation";
import { ProductAccessAdmin } from "@/components/d2d-platform/product-access-admin";
import { PortalShell } from "@/components/site-manager/portal-shell";
import { getAccessibleSites, getCurrentUser } from "@/lib/site-manager/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminDashboardData } from "@/lib/d2d-platform/admin-reporting";
import { isD2DIdentityProvisioningConfigured } from "@/lib/d2d-platform/keycloak-admin";
import { isClientInstructionsEmailConfigured } from "@/lib/d2d-platform/client-instructions-email";

export default async function ProductAccessPage() {
  const [user, sites] = await Promise.all([getCurrentUser(), getAccessibleSites()]);
  if (!user) redirect("/portal/login");
  const supabase = await createSupabaseServerClient();
  const { data: profile } = await supabase.from("profiles").select("is_platform_admin").eq("id", user.id).single();
  if (!profile?.is_platform_admin) redirect("/portal/dashboard");
  const [
    { data: organizations },
    { data: profiles },
    { data: organizationMembers },
    { data: entitlements },
    { data: memberships },
    dashboard,
  ] = await Promise.all([
    supabase.from("organizations").select("id,name").eq("status", "active").order("name"),
    supabase.from("profiles").select("id,display_name,email").order("email"),
    supabase.from("organization_members").select("organization_id,user_id,role"),
    supabase.from("product_entitlements").select("id,organization_id,product,status").order("created_at"),
    supabase.from("organization_product_members").select("id,organization_id,user_id,product,role").order("created_at"),
    getAdminDashboardData(),
  ]);
  return <PortalShell definition={null} access={sites[0]?.access ?? null} displayName={user.user_metadata?.display_name ?? user.email ?? "Account"} siteCount={sites.length}>
    <ProductAccessAdmin
      organizations={organizations ?? []}
      profiles={profiles ?? []}
      organizationMembers={organizationMembers ?? []}
      entitlements={entitlements ?? []}
      memberships={memberships ?? []}
      dashboard={dashboard}
      identityProvisioningReady={isD2DIdentityProvisioningConfigured()}
      instructionsEmailReady={isClientInstructionsEmailConfigured()}
    />
  </PortalShell>;
}
