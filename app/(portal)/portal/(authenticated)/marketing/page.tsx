import { redirect } from "next/navigation";
import { MarketingWorkspace } from "@/components/d2d-platform/marketing-workspace";
import { PortalShell } from "@/components/site-manager/portal-shell";
import { getProductAccess } from "@/lib/d2d-platform/access";
import { getAccessibleSites, getCurrentUser } from "@/lib/site-manager/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { marketingPlanContentSchema } from "@/lib/d2d-platform/schemas";
import type { MarketingPlanContent } from "@/lib/d2d-platform/types";

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ organization?: string }>;
}) {
  const [{ organization: requestedOrganization }, productAccess, sites, user] = await Promise.all([
    searchParams,
    getProductAccess(),
    getAccessibleSites(),
    getCurrentUser(),
  ]);
  const socialAccess = productAccess.filter((row) => row.product === "social");
  const access = socialAccess.find((row) => row.organizationId === requestedOrganization) ?? socialAccess[0];
  if (!access) redirect("/portal/dashboard?notice=no-social-access");
  const supabase = await createSupabaseServerClient();
  const [{ data: plans }, { data: promotions }, { data: batches }] = await Promise.all([
    supabase.from("marketing_plans").select("id,title,period_start,period_end,status,current_revision,approved_revision")
      .eq("organization_id", access.organizationId).order("period_start", { ascending: false }),
    supabase.from("promotions").select("id,name,description,starts_at,ends_at,channels,priority,status")
      .eq("organization_id", access.organizationId).order("starts_at", { ascending: false }),
    supabase.from("social_content_batches").select("id,title,period_start,period_end,status,sync_error")
      .eq("organization_id", access.organizationId).order("period_start", { ascending: false }),
  ]);
  const batchIds = (batches ?? []).map((batch) => batch.id);
  const planIds = (plans ?? []).map((plan) => plan.id);
  const [items, planVersions] = await Promise.all([
    batchIds.length > 0 ? supabase.from("social_content_items")
      .select("id,batch_id,content_day,platform,caption,media,creative_brief,scheduled_for,shoutrrr_post_id")
      .in("batch_id", batchIds).order("scheduled_for").then(({ data }) => data ?? []) : Promise.resolve([]),
    planIds.length > 0 ? supabase.from("marketing_plan_versions")
      .select("marketing_plan_id,revision,summary,plan")
      .in("marketing_plan_id", planIds).order("revision", { ascending: false }).then(({ data }) => data ?? []) : Promise.resolve([]),
  ]);
  const currentPlanVersions = new Map<string, { summary: string; plan: MarketingPlanContent }>();
  for (const version of planVersions) {
    const parsed = marketingPlanContentSchema.safeParse(version.plan);
    if (parsed.success && !currentPlanVersions.has(version.marketing_plan_id)) {
      currentPlanVersions.set(version.marketing_plan_id, { summary: version.summary, plan: parsed.data });
    }
  }
  const plansWithContent = (plans ?? []).flatMap((plan) => {
    const version = currentPlanVersions.get(plan.id);
    return version ? [{ ...plan, summary: version.summary, plan: version.plan }] : [];
  });
  return <PortalShell definition={null} access={sites[0]?.access ?? null} displayName={user?.user_metadata?.display_name ?? user?.email ?? "Account"} siteCount={sites.length}>
    <MarketingWorkspace
      access={access}
      plans={plansWithContent}
      promotions={promotions ?? []}
      batches={batches ?? []}
      items={items}
      schedulingEnabled={process.env.D2D_SOCIAL_SCHEDULING_ENABLED === "true"}
    />
  </PortalShell>;
}
