import { executeReportCommand } from "@/lib/digital-reporting/service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json(
      { error: "Same-origin request required." },
      { status: 403 },
    );
  try {
    if (Number(request.headers.get("content-length")) > 200000)
      return Response.json({ error: "Request too large." }, { status: 413 });
    const body = await request.text();
    if (body.length > 200000)
      return Response.json({ error: "Request too large." }, { status: 413 });
    const result = await executeReportCommand(JSON.parse(body));
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Report action failed.",
      },
      { status: 400 },
    );
  }
}
