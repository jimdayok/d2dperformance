import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { verifyOwnerTicket, hubOriginAllowed } from "@/lib/private-hub-ticket.js";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    if (!hubOriginAllowed(request.headers.get("origin"))) throw Error();
    if (Number(request.headers.get("content-length") || 0) > 4096) throw Error();
    const form = await request.formData();
    const claim = verifyOwnerTicket(String(form.get("ticket") || ""), "portal", process.env.D2D_HUB_SIGNING_SECRET);
    const admin = createSupabaseAdminClient();
    // Unique insertion consumes the ticket atomically; a replay always fails.
    const { error: replay } = await admin.from("d2d_hub_used_tickets").insert({ id: claim.jti, audience: claim.aud });
    if (replay) throw Error();
    const { data: existing, error: lookup } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (lookup || !existing.users.some(user => user.email === claim.sub && user.email_confirmed_at)) throw Error();
    const { data: link, error: issue } = await admin.auth.admin.generateLink({ type: "magiclink", email: claim.sub });
    if (issue || !link.properties?.hashed_token) throw Error();
    const { url, anonKey } = getSupabasePublicConfig();
    const writes: Array<{name: string; value: string; options: CookieOptions}> = [];
    const client = createServerClient(url, anonKey, { cookies: { getAll: () => [], setAll: (items) => { writes.push(...items); } } });
    const { data, error } = await client.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
    if (error || data.user?.email !== claim.sub) throw Error();
    // No external email is sent. Existing account roles and RLS remain in force.
    const response = NextResponse.redirect(new URL(claim.target === "review" ? "/portal/marketing" : claim.target === "analytics" ? "/portal/admin/analytics" : "/portal/dashboard", request.url), { status: 303, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
    // Cross-site POST omits old SameSite=Lax cookies. Expire leftover chunks
    // explicitly before writing the new session, so an old longer SSO cookie
    // cannot corrupt the new shorter session on the redirected GET.
    const cookieBase = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`;
    for (const name of [cookieBase, ...Array.from({length: 20}, (_,i) => `${cookieBase}.${i}`)]) response.cookies.set(name, '', { path: '/', maxAge: 0, secure: true, sameSite: 'lax' });
    for (const item of writes) response.cookies.set(item.name, item.value, { ...item.options, secure: true });
    return response;
  } catch { return new Response('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Open your D2D tool</title><body style="font-family:system-ui;padding:48px;background:#f5f4ef;color:#192b2c"><h1>Let’s reopen your tool</h1><p>The private handoff expired or could not be completed.</p><a href="https://d2dsites.tail56c449.ts.net/launch/portal">Open again from your private hub →</a></body></html>', { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } }); }
}
