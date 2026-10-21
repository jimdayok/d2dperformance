export function revalidationHeaders(siteSlug: string, target: string, token: string, roofingBypass = process.env.ROOFING_VERCEL_AUTOMATION_BYPASS_SECRET): Record<string, string> {
  const headers: Record<string, string> = { "content-type": "application/json", authorization: `Bearer ${token}` };
  // Allow the signed CMS refresh while retaining protection on the unlaunched site.
  if (siteSlug === "roofing-ontop" && new URL(target).origin === "https://roofing-ontop.vercel.app" && roofingBypass) {
    headers["x-vercel-protection-bypass"] = roofingBypass;
  }
  return headers;
}
