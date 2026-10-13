import { timingSafeEqual } from "node:crypto";
import { prepareMonthlyDrafts } from "@/lib/digital-reporting/recurring";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;
  const actual = request.headers.get("authorization") ?? "";
  if (
    !expected ||
    Buffer.byteLength(actual) !== Buffer.byteLength(`Bearer ${expected}`) ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(`Bearer ${expected}`))
  )
    return new Response("Unauthorized", { status: 401 });
  try {
    const result = await prepareMonthlyDrafts();
    return Response.json(result, {
      status: result.results.some((r) => r.status === "failed") ? 500 : 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Monthly draft preparation failed",
      },
      { status: 500 },
    );
  }
}
