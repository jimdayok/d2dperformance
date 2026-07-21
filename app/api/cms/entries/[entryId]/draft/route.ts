import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser, requireSiteAccess } from "@/lib/site-manager/access";
import { canEdit } from "@/lib/site-manager/permissions";
import { validateContent } from "@/lib/site-manager/validation";

const requestSchema = z.object({ siteSlug: z.string(), modelKey: z.string(), expectedRevision: z.number().int().positive(), title: z.string().min(1).max(240), slug: z.string().nullable().optional(), data: z.unknown() });

export async function PUT(request: Request, context: { params: Promise<{ entryId: string }> }) {
  if (!await getCurrentUser()) return Response.json({ error: "Authentication required." }, { status: 401 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid draft request.", details: parsed.error.flatten() }, { status: 400 });
  const { access } = await requireSiteAccess(parsed.data.siteSlug).catch(() => ({ access: null }));
  if (!access || !canEdit(access)) return Response.json({ error: "You cannot edit this site." }, { status: 403 });
  const validated = validateContent(parsed.data.siteSlug, parsed.data.modelKey, parsed.data.data);
  if (!validated.success) return Response.json({ error: "Content validation failed.", details: validated.error }, { status: 422 });
  const { entryId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("save_content_draft", { entry_id: entryId, expected_revision: parsed.data.expectedRevision, next_data: validated.data, next_title: parsed.data.title, next_slug: parsed.data.slug ?? null });
  if (error?.code === "40001") return Response.json({ error: "A newer draft exists. Reload before resolving the conflict." }, { status: 409 });
  if (error) return Response.json({ error: "The draft could not be saved." }, { status: 400 });
  return Response.json({ entry: data });
}
