import { requireBrandCopilotSession } from "@/lib/brand-copilot";
import { handleBrandDiscoverySubmission } from "@/lib/submission-service";
import type { DiscoverySubmission } from "@/types/brand-discovery";

export async function POST(request: Request) {
  try {
    await requireBrandCopilotSession();

    const payload = (await request.json()) as DiscoverySubmission;
    const delivery = await handleBrandDiscoverySubmission(payload);

    return Response.json({
      status: "accepted",
      message: "Brand discovery payload received.",
      receivedAt: new Date().toISOString(),
      fieldsSubmitted: Object.keys(payload.answers ?? {}).length,
      summariesSubmitted: Object.keys(payload.summaries ?? {}).length,
      delivery,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return Response.json(
      {
        error: "submission_failed",
        message: "Unable to submit brand discovery payload.",
      },
      { status: 500 },
    );
  }
}
