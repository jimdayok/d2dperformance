import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser, requireSiteAccess } from "@/lib/site-manager/access";
import { canPublish } from "@/lib/site-manager/permissions";
import { getSiteDefinition } from "@/lib/site-manager/registry";
import { signCmsToken } from "@/lib/site-manager/tokens";
import { validateContent } from "@/lib/site-manager/validation";

const schema = z.object({ siteSlug: z.string(), modelKey: z.string(), expectedRevision: z.number().int().positive(), path: z.string().startsWith("/") });
export async function POST(request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Invalid publish request." }, { status: 400 });
  const siteDefinition = getSiteDefinition(input.data.siteSlug);
  const siteAccess = await requireSiteAccess(input.data.siteSlug).catch(() => null);
  if (!siteDefinition || !siteAccess || !canPublish(siteAccess.access)) return Response.json({ error: "Publishing permission required." }, { status: 403 });
  if (!siteDefinition.allowedPreviewPaths.includes(input.data.path) && !/^\/(portfolio|journal)\/[a-z0-9-]+$/.test(input.data.path)) return Response.json({ error: "Path is not approved." }, { status: 400 });
  const { entryId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase.from("content_entries").select("draft_data,content_type,content_key").eq("id", entryId).eq("site_id", siteAccess.site.id).single();
  const valid = validateContent(input.data.siteSlug, input.data.modelKey, current?.draft_data);
  if (!valid.success) return Response.json({ error: "Draft no longer matches the current content model.", details: valid.error }, { status: 422 });
  const { data, error } = await supabase.rpc("publish_content_entry", { entry_id: entryId, expected_draft_revision: input.data.expectedRevision });
  if (error) return Response.json({ error: error.code === "40001" ? "A newer draft exists." : "Publish transaction failed." }, { status: error.code === "40001" ? 409 : 400 });
  const result = Array.isArray(data) ? data[0] : data;
  const eventId = result?.event?.id;
  const tags = valid.model.cacheTags(current?.content_key ?? "unknown", valid.data);
  try {
    const token = await signCmsToken({ audience: siteDefinition.previewAudience, siteId: siteAccess.site.id, siteSlug: input.data.siteSlug, userId: user.id, path: input.data.path, action: "revalidate", tags });
    const response = await fetch(`${siteAccess.site.preview_url}/api/cms/revalidate`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ path: input.data.path, tags }), cache: "no-store" });
    const summary = response.ok ? "Targeted revalidation accepted." : "Targeted revalidation rejected.";
    if (eventId) await createSupabaseAdminClient().from("publish_events").update({ status: response.ok ? "succeeded" : "failed", http_status: response.status, response_summary: summary, completed_at: new Date().toISOString() }).eq("id", eventId);
    return Response.json({ published: true, revalidated: response.ok, message: summary }, { status: response.ok ? 200 : 202 });
  } catch {
    if (eventId) await createSupabaseAdminClient().from("publish_events").update({ status: "failed", response_summary: "Revalidation request failed before a response.", completed_at: new Date().toISOString() }).eq("id", eventId);
    return Response.json({ published: true, revalidated: false, message: "Content published, but live refresh failed and can be retried." }, { status: 202 });
  }
}
