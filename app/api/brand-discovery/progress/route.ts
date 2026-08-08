import {
  syncBrandDiscoverySession,
  validateProgressPayload,
} from "@/lib/submission-service";
import { safeJsonParse } from "@/lib/brand-discovery-storage";
import type { DiscoveryProgressPayload } from "@/types/brand-discovery";
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
    const payload = safeJsonParse<DiscoveryProgressPayload | null>(bodyText, null);

    if (!payload || !payload.answers || !payload.startedAt || !payload.updatedAt) {
      return jsonError(request, "Invalid Brand Discovery progress payload.", 400);
    }

    const validationError = validateProgressPayload(payload);
    if (validationError) {
      return jsonError(request, validationError, 400);
    }

    await syncBrandDiscoverySession(payload);

    return withPublicCors(request, Response.json({
      ok: true,
      message: "Brand Discovery draft saved successfully.",
    }));
  } catch (error) {
    console.error("[brand-discovery] event=autosave error", error);
    return jsonError(
      request,
      "We couldn't sync this section right now. Your local progress is still saved.",
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
