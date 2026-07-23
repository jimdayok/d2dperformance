import { z } from "zod";
import { getCurrentUser, requireSiteAccess } from "@/lib/site-manager/access";
import { canPublish } from "@/lib/site-manager/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ siteSlug: z.string(), note: z.string().trim().min(1).max(5000), expectedRevision: z.number().int().positive() });
export async function POST(request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  if (!await getCurrentUser()) return Response.json({ error: "Authentication required." }, { status: 401 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "A review note is required." }, { status: 400 });
  const assignment = await requireSiteAccess(input.data.siteSlug).catch(() => null);
  if (!assignment || !canPublish(assignment.access)) return Response.json({ error: "Reviewer permission required." }, { status: 403 });
  const { entryId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase.from("content_entries").select("draft_revision,workflow_status").eq("id", entryId).eq("site_id", assignment.site.id).single();
  if (!current) return Response.json({ error: "This review item no longer exists or is not assigned to this site." }, { status: 404 });
  if (current.draft_revision !== input.data.expectedRevision) return Response.json({ error: "A newer draft exists. Refresh the review queue before continuing." }, { status: 409 });
  if (current.workflow_status !== "in_review") return Response.json({ error: "This item is no longer awaiting review. Refresh the review queue." }, { status: 409 });
  const { error } = await supabase.rpc("request_content_changes", { entry_id: entryId, note_text: input.data.note });
  if (error) return Response.json({ error: "The item changed while your request was being recorded. Refresh the review queue and try again." }, { status: 409 });
  return Response.json({ message: "Changes requested and review note recorded." });
}
