import {
  handleBrandDiscoveryProgress,
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

    if (!payload || !payload.answers || !payload.startedAt || !payload.updatedAt) {
      return jsonError("Invalid Brand Discovery progress payload.", 400);
    }

    const validationError = validateSubmission(payload);
    if (validationError) {
      return jsonError(validationError, 400);
    }

    await handleBrandDiscoveryProgress({
      ...payload,
      submittedAt: payload.submittedAt || payload.updatedAt,
    });

    return Response.json({
      ok: true,
      message: "Brand Discovery progress emailed successfully.",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Unable to email Brand Discovery progress.",
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
