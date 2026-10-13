import { createHash } from "node:crypto";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireReportAdmin } from "@/lib/digital-reporting/service";
import {
  normalizeClientLogo,
  maxLogoUploadBytes,
} from "@/lib/digital-reporting/branding";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    await requireReportAdmin();
    const organizationId = z
      .string()
      .uuid()
      .parse(new URL(request.url).searchParams.get("organizationId"));
    const db = await createSupabaseServerClient();
    const { data, error } = await db
      .from("digital_report_branding")
      .select("png_base64,sha256")
      .eq("organization_id", organizationId)
      .single();
    if (error || !data) return new Response("Logo not found", { status: 404 });
    const bytes = Buffer.from(data.png_base64, "base64");
    if (createHash("sha256").update(bytes).digest("hex") !== data.sha256)
      return new Response("Logo integrity error", { status: 500 });
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Logo not available", { status: 403 });
  }
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json(
      { error: "Same-origin request required." },
      { status: 403 },
    );
  try {
    await requireReportAdmin();
    if (
      Number(request.headers.get("content-length")) >
      maxLogoUploadBytes + 10000
    )
      return Response.json(
        { error: "Choose a logo smaller than 2 MB." },
        { status: 413 },
      );
    const reader = request.body?.getReader();
    if (!reader) throw new Error("Choose a logo file.");
    let total = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      total += part.value.length;
      if (total > maxLogoUploadBytes + 10000) {
        await reader.cancel();
        throw new Error("Choose a logo smaller than 2 MB.");
      }
      chunks.push(part.value);
    }
    const form = await new Response(new Uint8Array(Buffer.concat(chunks)), {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData();
    const organizationId = z.string().uuid().parse(form.get("organizationId"));
    const expected = z.coerce
      .number()
      .int()
      .positive()
      .parse(form.get("expected"));
    const remove = form.get("remove") === "true",
      file = form.get("logo");
    if (!remove && (!(file instanceof File) || file.size > maxLogoUploadBytes))
      throw new Error("Choose a PNG, JPG or WebP logo smaller than 2 MB.");
    const logo = remove
      ? null
      : await normalizeClientLogo(
          Buffer.from(await (file as File).arrayBuffer()),
          (file as File).name,
        );
    const db = await createSupabaseServerClient();
    const { error } = await db.rpc("digital_report_set_logo", {
      p_org: organizationId,
      p_expected: expected,
      p_logo: logo,
    });
    if (error) throw new Error(error.message);
    return Response.json(
      { status: "saved" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Logo could not be saved.",
      },
      { status: 400 },
    );
  }
}
