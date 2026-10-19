import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const passwordSetupTypes = new Set<EmailOtpType>(["invite", "recovery"]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const redirectOrigin = process.env.D2D_STUDIO_STAGING === "true" ? process.env.NEXT_PUBLIC_SITE_URL! : url.origin;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next");
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/portal/set-password";

  if (!tokenHash || !type || !passwordSetupTypes.has(type)) {
    return NextResponse.redirect(new URL("/portal/login?auth_error=invalid_link", redirectOrigin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    return NextResponse.redirect(new URL("/portal/login?auth_error=expired_link", redirectOrigin));
  }

  return NextResponse.redirect(new URL(safeNext, redirectOrigin));
}
