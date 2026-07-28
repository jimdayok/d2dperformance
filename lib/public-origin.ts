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

  return Boolean(
    originHost &&
      (originHost === requestHost ||
        originHost === canonicalHost ||
        configuredHosts.includes(originHost)),
  );
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
