import { z } from "zod";
import { getCurrentUser, requireSiteAccess } from "@/lib/site-manager/access";
import { canEdit } from "@/lib/site-manager/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const metadataSchema = z.object({ siteSlug: z.string(), altText: z.string().max(240), decorative: z.enum(["true", "false"]).transform((value) => value === "true"), caption: z.string().max(500).optional() });
const allowed = new Map([["image/jpeg", ["jpg", "jpeg"]], ["image/png", ["png"]], ["image/webp", ["webp"]]]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });
  const form = await request.formData();
  const metadata = metadataSchema.safeParse({ siteSlug: form.get("siteSlug"), altText: form.get("altText"), decorative: form.get("decorative") ?? "false", caption: form.get("caption") || undefined });
  const file = form.get("file");
  if (!metadata.success || !(file instanceof File)) return Response.json({ error: "Valid image metadata and file are required." }, { status: 400 });
  const assignment = await requireSiteAccess(metadata.data.siteSlug).catch(() => null);
  if (!assignment || !canEdit(assignment.access)) return Response.json({ error: "Upload permission required." }, { status: 403 });
  if (file.size > 20 * 1024 * 1024 || !allowed.has(file.type)) return Response.json({ error: "Use a JPEG, PNG, or WebP image up to 20 MB." }, { status: 415 });
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!allowed.get(file.type)?.includes(extension)) return Response.json({ error: "The file extension does not match its MIME type." }, { status: 415 });
  if (!metadata.data.decorative && metadata.data.altText.trim().length === 0) return Response.json({ error: "Alt text is required unless the image is decorative." }, { status: 422 });
  const cleanName = file.name.slice(0, -(extension.length + 1)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "image";
  const now = new Date();
  const path = `${assignment.site.id}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}-${cleanName}.${extension}`;
  const supabase = await createSupabaseServerClient();
  const { error: uploadError } = await supabase.storage.from("site-manager-drafts").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return Response.json({ error: "Image upload failed." }, { status: 400 });
  const { data, error } = await supabase.from("media_assets").insert({ site_id: assignment.site.id, source_kind: "supabase_draft", storage_bucket: "site-manager-drafts", storage_path: path, original_filename: file.name, mime_type: file.type, byte_size: file.size, alt_text: metadata.data.altText, caption: metadata.data.caption ?? null, is_decorative: metadata.data.decorative, created_by: user.id }).select().single();
  if (error) return Response.json({ error: "Image was uploaded but its media record failed. Contact D2D support." }, { status: 500 });
  return Response.json({ asset: data }, { status: 201 });
}
