import "server-only";
import { cache } from "react";
import { connection } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SiteRole, UserAccess } from "@/lib/site-manager/types";

type SiteRow = { id: string; organization_id: string; slug: string; name: string; publishing_mode: UserAccess["publishingMode"]; production_url: string; preview_url: string };

export const getCurrentUser = cache(async () => {
  await connection();
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
});

export const getAccessibleSites = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createSupabaseServerClient();
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("is_platform_admin,display_name,email").eq("id", user.id).single(),
    supabase.from("organization_members").select("organization_id,role").eq("user_id", user.id),
  ]);
  const isPlatformAdmin = Boolean(profile?.is_platform_admin);
  if (!isPlatformAdmin && !memberships?.length) return [];
  let query = supabase.from("sites").select("id,organization_id,slug,name,publishing_mode,production_url,preview_url").eq("status", "active");
  if (!isPlatformAdmin) query = query.in("organization_id", (memberships ?? []).map((membership) => membership.organization_id));
  const { data: sites } = await query;
  return (sites ?? []).map((site) => ({
    site: site as SiteRow,
    access: {
      userId: user.id,
      isPlatformAdmin,
      role: ((memberships ?? []).find((membership) => membership.organization_id === site.organization_id)?.role ?? null) as SiteRole | null,
      siteId: site.id,
      organizationId: site.organization_id,
      publishingMode: site.publishing_mode as UserAccess["publishingMode"],
    } satisfies UserAccess,
  }));
});

export async function requireSiteAccess(siteSlug: string) {
  const match = (await getAccessibleSites()).find(({ site }) => site.slug === siteSlug);
  if (!match) throw new Error("You do not have access to this site.");
  return match;
}
