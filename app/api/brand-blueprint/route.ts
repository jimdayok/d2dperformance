import type { DiscoverySubmission } from "@/types/brand-discovery";

export async function POST(request: Request) {
  const payload = (await request.json()) as DiscoverySubmission;

  return Response.json({
    status: "accepted",
    message: "Brand discovery payload received.",
    receivedAt: new Date().toISOString(),
    fieldsSubmitted: Object.keys(payload.answers ?? {}).length,
    summariesSubmitted: Object.keys(payload.summaries ?? {}).length,
  });
}
