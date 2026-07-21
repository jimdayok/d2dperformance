import { z } from "zod";
import { getCurrentUser, requireSiteAccess } from "@/lib/site-manager/access";
import { getSiteDefinition } from "@/lib/site-manager/registry";
import { signCmsToken } from "@/lib/site-manager/tokens";

const schema = z.object({ siteSlug: z.string(), path: z.string().startsWith("/") });
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Invalid preview request." }, { status: 400 });
  const definition = getSiteDefinition(input.data.siteSlug);
  const access = await requireSiteAccess(input.data.siteSlug).catch(() => null);
  if (!definition || !access) return Response.json({ error: "Site access denied." }, { status: 403 });
  if (!definition.allowedPreviewPaths.includes(input.data.path) && !/^\/(portfolio|journal)\/[a-z0-9-]+$/.test(input.data.path)) return Response.json({ error: "Preview path is not approved." }, { status: 400 });
  const token = await signCmsToken({ audience: definition.previewAudience, siteId: access.site.id, siteSlug: input.data.siteSlug, userId: user.id, path: input.data.path, action: "preview" });
  return Response.json({ url: `${access.site.preview_url}/api/cms/preview?token=${encodeURIComponent(token)}` });
}
