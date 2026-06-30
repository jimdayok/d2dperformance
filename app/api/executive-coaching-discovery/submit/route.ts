import {
  handleExecutiveCoachingSubmission,
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
      return jsonError("Invalid Executive Coaching Discovery payload.", 400);
    }

    const validationError = validateSubmission(payload);
    if (validationError) {
      return jsonError(validationError, 400);
    }

    await handleExecutiveCoachingSubmission(payload);

    return Response.json({
      ok: true,
      message: "Executive Coaching Discovery submitted successfully.",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Unable to submit Executive Coaching Discovery.",
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
