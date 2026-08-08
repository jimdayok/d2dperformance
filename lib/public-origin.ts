import { siteUrl } from "@/lib/site-data";

function hostFromUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).host.toLowerCase();
  } catch {
    return null;
  }
}

export function hasTrustedPublicOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const requestHost = hostFromUrl(request.url);
  const originHost = hostFromUrl(origin);
  const canonicalHost = hostFromUrl(siteUrl);
  const configuredHosts = (process.env.BRAND_DISCOVERY_ALLOWED_ORIGIN ?? "")
    .split(",")
    .map((value) => hostFromUrl(value.trim()))
    .filter(Boolean);
  const d2dMarketingHosts = ["d2dmktg.com", "www.d2dmktg.com"];

  return Boolean(
    originHost &&
      (originHost === requestHost ||
        originHost === canonicalHost ||
        d2dMarketingHosts.includes(originHost) ||
        configuredHosts.includes(originHost)),
  );
}

export function withPublicCors(request: Request, response: Response) {
  const origin = request.headers.get("origin");

  if (!origin || !hasTrustedPublicOrigin(request)) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.append("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function publicOptionsResponse(request: Request) {
  if (!hasTrustedPublicOrigin(request)) {
    return untrustedOriginResponse();
  }

  return withPublicCors(request, new Response(null, { status: 204 }));
}

export function untrustedOriginResponse() {
  return Response.json(
    {
      ok: false,
      error: "This endpoint only accepts requests from the D2D Marketing website.",
    },
    { status: 403 },
  );
}
