import { createHash } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  const version = Number(new URL(request.url).searchParams.get("version"));
  if (!Number.isInteger(version) || version < 1)
    return new Response("Version required", { status: 400 });
  const db = await createSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return new Response("Sign in required", { status: 401 });
  // RLS exposes drafts only to administrators and accepted versions to customer members.
  const { data, error } = await db
    .from("digital_report_versions")
    .select("pdf_base64,pdf_sha256")
    .eq("report_id", reportId)
    .eq("version", version)
    .single();
  if (error || !data) return new Response("Report not found", { status: 404 });
  const bytes = Buffer.from(data.pdf_base64, "base64");
  if (createHash("sha256").update(bytes).digest("hex") !== data.pdf_sha256)
    return new Response("PDF integrity error", { status: 500 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="D2D-Performance-v${version}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
