"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SetPasswordState = { error?: string };

const passwordSchema = z
  .object({
    password: z.string().min(12, "Use at least 12 characters."),
    confirmation: z.string(),
  })
  .refine((values) => values.password === values.confirmation, {
    message: "Passwords do not match.",
    path: ["confirmation"],
  });

export async function setPassword(_: SetPasswordState, formData: FormData): Promise<SetPasswordState> {
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid password." };

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "This secure link is invalid or expired. Request a new password-reset email." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "The password could not be saved. Request a new password-reset email and try again." };
  redirect("/portal/dashboard");
}
