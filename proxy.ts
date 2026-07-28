import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const canonicalWebsiteHost = "d2dmktg.com";
const redirectWebsiteHosts = new Set([
  "www.d2dmktg.com",
  "d2dperformance.com",
  "www.d2dperformance.com",
]);
const publicWebsiteHosts = new Set([
  canonicalWebsiteHost,
  ...redirectWebsiteHosts,
]);

export async function proxy(request: NextRequest) {
  const hostname = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const isPortalHost = hostname === "portal.d2dperformance.com" || hostname === "portal.localhost";
  const url = request.nextUrl.clone();

  if (redirectWebsiteHosts.has(hostname)) {
    url.protocol = "https:";
    url.hostname = canonicalWebsiteHost;
    url.port = "";
    return NextResponse.redirect(url, 308);
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
    const portalUrl = new URL(process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://portal.d2dperformance.com");
    portalUrl.pathname = url.pathname.replace(/^\/portal/, "") || "/dashboard";
    portalUrl.search = url.search;
    return NextResponse.redirect(portalUrl);
  }

  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && anonKey && (url.pathname.startsWith("/portal") || url.pathname.startsWith("/api/cms"))) {
    const supabase = createServerClient(supabaseUrl, anonKey, {
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
