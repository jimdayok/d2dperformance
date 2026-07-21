import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSiteDefinition } from "@/lib/site-manager/registry";
import { verifyCmsToken } from "@/lib/site-manager/tokens";

const querySchema = z.object({ contentType: z.string().regex(/^[a-z][a-z0-9_]*$/).optional(), contentKey: z.string().max(180).optional() });

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Preview token required." }, { status: 401 });
  const url = new URL(request.url);
  const query = querySchema.safeParse({ contentType: url.searchParams.get("contentType") ?? undefined, contentKey: url.searchParams.get("contentKey") ?? undefined });
  if (!query.success) return Response.json({ error: "Invalid preview query." }, { status: 400 });
  try {
    const unverified = JSON.parse(Buffer.from(authorization.slice(7).split(".")[1], "base64url").toString()) as { siteSlug?: string };
    const definition = unverified.siteSlug ? getSiteDefinition(unverified.siteSlug) : null;
    if (!definition) throw new Error("Unknown site.");
    const payload = await verifyCmsToken(authorization.slice(7), definition.previewAudience, "preview");
    if (payload.siteSlug !== definition.key || typeof payload.siteId !== "string") throw new Error("Site scope mismatch.");
    let builder = createSupabaseAdminClient().from("content_entries").select("content_type,content_key,draft_data,draft_revision,updated_at").eq("site_id", payload.siteId).is("deleted_at", null);
    if (query.data.contentType) builder = builder.eq("content_type", query.data.contentType);
    if (query.data.contentKey) builder = builder.eq("content_key", query.data.contentKey);
    const { data, error } = await builder;
    if (error) throw error;
    return Response.json({ entries: data }, { headers: { "cache-control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Preview token is invalid or expired." }, { status: 401, headers: { "cache-control": "private, no-store" } });
  }
}
