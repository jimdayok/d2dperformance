import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safePortalDestination(value: string | null) {
  return value?.startsWith("/portal/") && !value.startsWith("//")
    ? value
    : "/portal/dashboard";
}
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  if (process.env.D2D_SSO_ENABLED !== "true") {
    return NextResponse.redirect(new URL("/portal/login?auth_error=sso_unavailable", requestUrl.origin));
  }
  const next = safePortalDestination(requestUrl.searchParams.get("next"));
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? requestUrl.origin;
  const redirectTo = new URL("/portal/auth/callback", portalUrl);
  redirectTo.searchParams.set("next", next);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "keycloak",
    options: { redirectTo: redirectTo.toString(), scopes: "openid profile email" },
  });
  if (error || !data.url) {
    return NextResponse.redirect(new URL("/portal/login?auth_error=sso_start", requestUrl.origin));
  }
  return NextResponse.redirect(data.url);
}
