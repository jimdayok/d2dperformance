import {
  handleBrandDiscoverySubmission,
  validateBrandDiscoverySubmission,
} from "@/lib/submission-service";
import { safeJsonParse } from "@/lib/brand-discovery-storage";
import type { DiscoverySubmission } from "@/types/brand-discovery";
import {
  hasTrustedPublicOrigin,
  publicOptionsResponse,
  untrustedOriginResponse,
  withPublicCors,
} from "@/lib/public-origin";

function jsonError(request: Request, error: string, status: number) {
  return withPublicCors(request, Response.json({ ok: false, error }, { status }));
}

export function OPTIONS(request: Request) {
  return publicOptionsResponse(request);
}

export async function POST(request: Request) {
  try {
    if (!hasTrustedPublicOrigin(request)) {
      return untrustedOriginResponse();
    }

    const bodyText = await request.text();
    const payload = safeJsonParse<DiscoverySubmission | null>(bodyText, null);

    if (!payload || !payload.answers || !payload.submittedAt || !payload.startedAt || !payload.updatedAt) {
      return jsonError(request, "Invalid Brand Discovery payload.", 400);
    }

    const validationError = validateBrandDiscoverySubmission(payload);
    if (validationError) {
      return jsonError(request, validationError, 400);
    }

    await handleBrandDiscoverySubmission(payload);

    return withPublicCors(request, Response.json({
      ok: true,
      message:
        "Your brand discovery request has been received. We'll review your information and follow up with next steps.",
    }));
  } catch (error) {
    console.error("Brand discovery submission failed.", error);
    return jsonError(
      request,
      "We couldn't complete your submission right now. Your progress is still saved. Please try again in a moment.",
      500,
    );
  }
}

export async function GET(request: Request) {
  return jsonError(request, "Method not allowed.", 405);
}

export async function PUT(request: Request) {
  return jsonError(request, "Method not allowed.", 405);
}

export async function PATCH(request: Request) {
  return jsonError(request, "Method not allowed.", 405);
}

export async function DELETE(request: Request) {
  return jsonError(request, "Method not allowed.", 405);
}
