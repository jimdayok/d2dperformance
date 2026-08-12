import "server-only";
import { create, randomInt } from "altcha-lib/frameworks/nextjs";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

class SupabaseChallengeStore {
  async get(key: string) {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("website_feedback_altcha_uses")
      .select("challenge_id")
      .eq("challenge_id", key)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  async set(key: string) {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("website_feedback_altcha_uses")
      .insert({ challenge_id: key });
    if (error) throw error;
    return true;
  }
}

function getSecret() {
  const secret = process.env.WEBSITE_FEEDBACK_ALTCHA_SECRET ?? process.env.BRAND_DISCOVERY_SESSION_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error("Website feedback anti-bot verification is not configured.");
  }
  return secret;
}

export function createWebsiteFeedbackAltcha() {
  return create({
    hmacSignatureSecret: getSecret(),
    deriveKey,
    createChallengeParameters: () => ({
      algorithm: "PBKDF2/SHA-256",
      cost: 5_000,
      counter: randomInt(5_000, 10_000),
      expiresAt: new Date(Date.now() + 10 * 60 * 1_000),
      data: { challengeId: crypto.randomUUID(), purpose: "website-feedback" },
    }),
    store: new SupabaseChallengeStore(),
  });
}
