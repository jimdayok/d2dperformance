import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser, requireSiteAccess } from "@/lib/site-manager/access";
import { canPublish } from "@/lib/site-manager/permissions";

const schema = z.object({ siteSlug: z.string(), versionId: z.string().uuid(), expectedRevision: z.number().int().positive() });
export async function POST(request: Request) {
  if (!await getCurrentUser()) return Response.json({ error: "Authentication required." }, { status: 401 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Invalid restore request." }, { status: 400 });
  const site = await requireSiteAccess(input.data.siteSlug).catch(() => null);
  if (!site || !canPublish(site.access)) return Response.json({ error: "Restore permission required." }, { status: 403 });
  const { data, error } = await (await createSupabaseServerClient()).rpc("restore_content_version", { version_id: input.data.versionId, expected_revision: input.data.expectedRevision });
  if (error) return Response.json({ error: error.code === "40001" ? "A newer draft exists." : "Version could not be restored." }, { status: error.code === "40001" ? 409 : 400 });
  return Response.json({ entry: data, message: "Version restored to draft. The live site is unchanged." });
}
