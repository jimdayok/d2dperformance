import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const canonicalWebsiteHost = "performance.d2dmktg.com";
const canonicalPortalHost = "webadmin.d2dmktg.com";
const digitalWebsiteUrl = "https://digital.d2dmktg.com";
const portalRedirectHosts = new Set(["portal.d2dperformance.com"]);
const performanceRedirectHosts = new Set([
  "d2dperformance.com",
  "www.d2dperformance.com",
]);
const publicWebsiteHosts = new Set([
  canonicalWebsiteHost,
  ...performanceRedirectHosts,
]);

export async function proxy(request: NextRequest) {
  const hostname = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const isPortalHost = hostname === canonicalPortalHost || hostname === "portal.localhost";
  const url = request.nextUrl.clone();
  if (url.pathname.startsWith("/review/social/") || url.pathname.startsWith("/api/social-review/client/")) {
    const privateResponse=NextResponse.next({request});
    privateResponse.headers.set("Referrer-Policy","no-referrer");
    privateResponse.headers.set("Cache-Control","private, no-store");
    privateResponse.headers.set("X-Robots-Tag","noindex, nofollow, noarchive");
    privateResponse.headers.set("Content-Security-Policy","default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; font-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    return privateResponse;
  }


  if (portalRedirectHosts.has(hostname)) {
    url.protocol = "https:";
    url.hostname = canonicalPortalHost;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  if (performanceRedirectHosts.has(hostname)) {
    if (url.pathname === "/digital") {
      const digitalUrl = new URL(digitalWebsiteUrl);
      digitalUrl.search = url.search;
      return NextResponse.redirect(digitalUrl, 308);
    }

    url.protocol = "https:";
    url.hostname = canonicalWebsiteHost;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  if (hostname === "www.d2dmktg.com") {
    url.protocol = "https:";
    url.hostname = "d2dmktg.com";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  if (hostname === canonicalWebsiteHost && url.pathname === "/digital") {
    const digitalUrl = new URL(digitalWebsiteUrl);
    digitalUrl.search = url.search;
    return NextResponse.redirect(digitalUrl, 308);
  }

  if (isPortalHost && url.pathname === "/" && url.searchParams.has("code")) {
    url.pathname = "/portal/auth/callback";
    return NextResponse.rewrite(url);
  }

  if (isPortalHost && !url.pathname.startsWith("/portal") && !url.pathname.startsWith("/api")) {
    url.pathname = url.pathname === "/" ? "/portal/dashboard" : `/portal${url.pathname}`;
    return NextResponse.rewrite(url);
  }
  if (publicWebsiteHosts.has(hostname) && url.pathname.startsWith("/portal")) {
    const portalUrl = new URL(process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://webadmin.d2dmktg.com");
    portalUrl.pathname = url.pathname.replace(/^\/portal/, "") || "/dashboard";
    portalUrl.search = url.search;
    return NextResponse.redirect(portalUrl);
  }

  if (process.env.D2D_STUDIO_STAGING !== "true" && (url.pathname === "/portal/set-password" || url.pathname === "/portal/auth/confirm")) return NextResponse.redirect(new URL("/portal/login/d2d", request.url));

  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && anonKey && (url.pathname.startsWith("/portal") || url.pathname.startsWith("/api/cms"))) {
    const supabase = createServerClient(process.env.SUPABASE_SERVER_URL || supabaseUrl, anonKey, {
      cookieOptions:{name:'sb-'+new URL(supabaseUrl).hostname.split('.')[0]+'-auth-token'},
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    await supabase.auth.getUser();
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
