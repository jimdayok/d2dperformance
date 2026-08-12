import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSiteDefinition } from "@/lib/site-manager/registry";

const querySchema = z.object({
  siteSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  contentType: z.string().regex(/^[a-z][a-z0-9_]*$/).optional(),
  contentKey: z.string().min(1).max(180).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = querySchema.safeParse({
    siteSlug: url.searchParams.get("siteSlug"),
    contentType: url.searchParams.get("contentType") ?? undefined,
    contentKey: url.searchParams.get("contentKey") ?? undefined,
  });
  if (!query.success) return Response.json({ error: "Invalid content request." }, { status: 400 });

  const definition = getSiteDefinition(query.data.siteSlug);
  if (!definition) return Response.json({ error: "Unknown managed site." }, { status: 404 });
  const allowedTypes = new Set(Object.values(definition.models).map((model) => model.contentType));
  if (query.data.contentType && !allowedTypes.has(query.data.contentType)) {
    return Response.json({ error: "Content type is not public for this site." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: site } = await supabase.from("sites").select("id").eq("slug", query.data.siteSlug).eq("status", "active").maybeSingle();
  if (!site) return Response.json({ error: "Managed site is not active." }, { status: 404 });

  let builder = supabase
    .from("content_entries")
    .select("content_type,content_key,published_data,published_revision,published_at")
    .eq("site_id", site.id)
    .eq("workflow_status", "published")
    .is("deleted_at", null)
    .not("published_data", "is", null);
  if (query.data.contentType) builder = builder.eq("content_type", query.data.contentType);
  if (query.data.contentKey) builder = builder.eq("content_key", query.data.contentKey);
  const { data, error } = await builder;
  if (error) return Response.json({ error: "Published content could not be loaded." }, { status: 503 });

  return Response.json(
    { entries: data ?? [] },
    { headers: { "cache-control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400" } },
  );
}
