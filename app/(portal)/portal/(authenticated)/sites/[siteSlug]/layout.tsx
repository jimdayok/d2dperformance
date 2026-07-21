import { notFound } from "next/navigation";
import { PortalShell } from "@/components/site-manager/portal-shell";
import { getAccessibleSites, getCurrentUser, requireSiteAccess } from "@/lib/site-manager/access";
import { getSiteDefinition } from "@/lib/site-manager/registry";

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ siteSlug: string }> }) {
  const { siteSlug } = await params;
  const definition = getSiteDefinition(siteSlug);
  if (!definition) notFound();
  const [{ access }, sites, user] = await Promise.all([requireSiteAccess(siteSlug), getAccessibleSites(), getCurrentUser()]);
  return <PortalShell definition={definition} access={access} displayName={user?.user_metadata?.display_name ?? user?.email ?? "Account"} siteCount={sites.length}>{children}</PortalShell>;
}
