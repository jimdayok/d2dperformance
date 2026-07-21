import { z } from "zod";
import { getCurrentUser, requireSiteAccess } from "@/lib/site-manager/access";
import { canPublish } from "@/lib/site-manager/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({ siteSlug: z.string(), note: z.string().min(1).max(5000) });
export async function POST(request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  if (!await getCurrentUser()) return Response.json({ error: "Authentication required." }, { status: 401 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "A review note is required." }, { status: 400 });
  const assignment = await requireSiteAccess(input.data.siteSlug).catch(() => null);
  if (!assignment || !canPublish(assignment.access)) return Response.json({ error: "Reviewer permission required." }, { status: 403 });
  const { entryId } = await params;
  const { error } = await (await createSupabaseServerClient()).rpc("request_content_changes", { entry_id: entryId, note_text: input.data.note });
  if (error) return Response.json({ error: "Changes could not be requested." }, { status: 400 });
  return Response.json({ message: "Changes requested and review note recorded." });
}
