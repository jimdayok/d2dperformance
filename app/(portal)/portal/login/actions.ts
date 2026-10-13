"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; message?: string };
export async function login(): Promise<LoginState> {
  return { error: "Use D2D Account single sign-on." };
}
export async function requestPasswordReset(): Promise<LoginState> {
  return { error: "Manage your password through D2D Account." };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("https://account.d2dperformance.com/realms/d2d/protocol/openid-connect/logout?client_id=d2d-site-manager");
}
