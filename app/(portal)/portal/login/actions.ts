"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; message?: string };
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

export async function login(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Enter a valid email and password." };
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Sign-in failed. Check your details or reset your password." };
  redirect("/portal/dashboard");
}

export async function requestPasswordReset(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Enter your email address first." };
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? "http://localhost:3000/portal";
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${portalUrl}/auth/callback?next=/portal/set-password` });
  return { message: "If an account exists, password reset instructions have been sent." };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/portal/login");
}
