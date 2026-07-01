import {
  handleBrandDiscoverySubmission,
  validateBrandDiscoverySubmission,
} from "@/lib/submission-service";
import { safeJsonParse } from "@/lib/brand-discovery-storage";
import type { DiscoverySubmission } from "@/types/brand-discovery";

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const payload = safeJsonParse<DiscoverySubmission | null>(bodyText, null);

    if (!payload || !payload.answers || !payload.submittedAt || !payload.startedAt || !payload.updatedAt) {
      return Response.json(
        {
          error: "invalid_payload",
          message: "Unable to submit brand discovery payload.",
        },
        { status: 400 },
      );
    }

    const validationError = validateBrandDiscoverySubmission(payload);
    if (validationError) {
      return Response.json(
        {
          error: "invalid_payload",
          message: validationError,
        },
        { status: 400 },
      );
    }

    const delivery = await handleBrandDiscoverySubmission(payload);

    return Response.json({
      status: "accepted",
      message: "Brand discovery payload received.",
      receivedAt: new Date().toISOString(),
      fieldsSubmitted: Object.keys(payload.answers ?? {}).length,
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
