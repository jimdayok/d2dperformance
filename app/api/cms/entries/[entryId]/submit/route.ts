import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser, requireSiteAccess } from "@/lib/site-manager/access";
import { canEdit } from "@/lib/site-manager/permissions";

const schema = z.object({ siteSlug: z.string(), expectedRevision: z.number().int().positive() });
export async function POST(request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  if (!await getCurrentUser()) return Response.json({ error: "Authentication required." }, { status: 401 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Invalid review request." }, { status: 400 });
  const { access } = await requireSiteAccess(input.data.siteSlug).catch(() => ({ access: null }));
  if (!access || !canEdit(access)) return Response.json({ error: "Not permitted." }, { status: 403 });
  const supabase = await createSupabaseServerClient();
  const { entryId } = await params;
  const { data, error } = await supabase.rpc("submit_content_for_review", { entry_id: entryId, expected_revision: input.data.expectedRevision });
  if (error?.code === "40001") return Response.json({ error: "A newer draft exists." }, { status: 409 });
  if (error) return Response.json({ error: "Submission failed." }, { status: 400 });
  return Response.json({ entry: data });
}
