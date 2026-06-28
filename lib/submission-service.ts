import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { reportToMarkdown } from "@/lib/brand-report";
import { buildBrandReport } from "@/lib/brand-report";
import type { DiscoverySubmission } from "@/types/brand-discovery";

type SubmissionResult = {
  databaseSaved: boolean;
  emailSent: boolean;
  configured: boolean;
};

const {
  RESEND_API_KEY,
  BRAND_DISCOVERY_NOTIFICATION_EMAIL,
  BRAND_DISCOVERY_FROM_EMAIL,
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

function createSupabaseAdmin() {
  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function createResendClient() {
  return RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
}

export function isSubmissionServiceConfigured() {
  return Boolean(
    RESEND_API_KEY &&
      BRAND_DISCOVERY_NOTIFICATION_EMAIL &&
      BRAND_DISCOVERY_FROM_EMAIL &&
      NEXT_PUBLIC_SUPABASE_URL &&
      SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function handleBrandDiscoverySubmission(
  payload: DiscoverySubmission,
): Promise<SubmissionResult> {
  const supabase = createSupabaseAdmin();
  const resend = createResendClient();
  const configured = isSubmissionServiceConfigured();

  let databaseSaved = false;
  let emailSent = false;

  if (supabase) {
    const { error } = await supabase.from("brand_discovery_submissions").insert({
      submitted_at: payload.submittedAt,
      answers: payload.answers,
      summaries: payload.summaries,
      report_markdown: reportToMarkdown(buildBrandReport(payload.answers)),
    });

    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    databaseSaved = true;
  }

  if (
    resend &&
    BRAND_DISCOVERY_NOTIFICATION_EMAIL &&
    BRAND_DISCOVERY_FROM_EMAIL
  ) {
    const report = buildBrandReport(payload.answers);
    const companyName =
      typeof payload.answers.companyName === "string"
        ? payload.answers.companyName
        : "Unknown company";
    const founderName =
      typeof payload.answers.founderName === "string"
        ? payload.answers.founderName
        : "Unknown founder";

    await resend.emails.send({
      from: BRAND_DISCOVERY_FROM_EMAIL,
      to: BRAND_DISCOVERY_NOTIFICATION_EMAIL,
      subject: `New D2D Brand Discovery: ${companyName}`,
      text: [
        `A new brand discovery was submitted on ${payload.submittedAt}.`,
        ``,
        `Founder: ${founderName}`,
        `Company: ${companyName}`,
        ``,
        `Summaries:`,
        ...Object.entries(payload.summaries).flatMap(([section, items]) => [
          `${section}:`,
          ...items.map((item) => `- ${item}`),
          ``,
        ]),
        `Full Report`,
        reportToMarkdown(report),
      ].join("\n"),
    });

    emailSent = true;
  }

  return {
    databaseSaved,
    emailSent,
    configured,
  };
}
