import {
  handleBrandDiscoverySubmission,
  validateSubmission,
} from "@/lib/submission-service";
import { safeJsonParse } from "@/lib/brand-discovery-storage";
import type { DiscoverySubmission } from "@/types/brand-discovery";

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const payload = safeJsonParse<DiscoverySubmission | null>(bodyText, null);

    if (!payload || !payload.answers || !payload.submittedAt || !payload.startedAt || !payload.updatedAt) {
      return jsonError("Invalid Brand Discovery payload.", 400);
    }

    const validationError = validateSubmission(payload);
    if (validationError) {
      return jsonError(validationError, 400);
    }

    await handleBrandDiscoverySubmission(payload);

    return Response.json({
      ok: true,
      message:
        "Your brand discovery request has been received. We'll review your information and follow up with next steps.",
    });
  } catch (error) {
    console.error("Brand discovery submission failed.", error);
    return jsonError(
      "We couldn't complete your submission right now. Your progress is still saved. Please try again in a moment.",
      500,
    );
  }
}

export async function GET() {
  return jsonError("Method not allowed.", 405);
}

export async function PUT() {
  return jsonError("Method not allowed.", 405);
}

export async function PATCH() {
  return jsonError("Method not allowed.", 405);
}

export async function DELETE() {
  return jsonError("Method not allowed.", 405);
}
