import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import type { DiscoveryAnswer, DiscoverySubmission } from "@/types/brand-discovery";

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

function answerToText(value: DiscoveryAnswer | undefined) {
  if (typeof value === "string") {
    return value.trim() || "Not provided";
  }

  if (typeof value === "number") {
    return `${value}`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "Not provided";
    }

    if (typeof value[0] === "string") {
      return (value as string[]).join(", ");
    }

    return (value as Array<{ name: string }>).map((file) => file.name).join(", ");
  }

  return "Not provided";
}

function answersToMarkdown(payload: DiscoverySubmission) {
  const lines = [
    "# Brand Discovery Submission",
    "",
    `Submitted: ${payload.submittedAt}`,
    `Started: ${payload.startedAt}`,
    `Last Updated: ${payload.updatedAt}`,
    "",
    "## Answers",
    "",
  ];

  for (const [key, value] of Object.entries(payload.answers)) {
    lines.push(`### ${key}`);
    lines.push(answerToText(value));
    lines.push("");
  }

  return lines.join("\n");
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
  const reportMarkdown = answersToMarkdown(payload);

  let databaseSaved = false;
  let emailSent = false;

  if (supabase) {
    const { error } = await supabase.from("brand_discovery_submissions").insert({
      submitted_at: payload.submittedAt,
      answers: payload.answers,
      summaries: {},
      report_markdown: reportMarkdown,
    });

    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    databaseSaved = true;
  }

  if (resend && BRAND_DISCOVERY_NOTIFICATION_EMAIL && BRAND_DISCOVERY_FROM_EMAIL) {
    const companyName =
      typeof payload.answers.companyName === "string"
        ? payload.answers.companyName
        : typeof payload.answers.contactName === "string"
          ? payload.answers.contactName
          : "Unknown company";

    await resend.emails.send({
      from: BRAND_DISCOVERY_FROM_EMAIL,
      to: BRAND_DISCOVERY_NOTIFICATION_EMAIL,
      subject: `New D2D Brand Discovery: ${companyName}`,
      text: reportMarkdown,
    });

    emailSent = true;
  }

  return {
    databaseSaved,
    emailSent,
    configured,
  };
}
