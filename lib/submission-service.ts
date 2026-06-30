import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import type {
  DiscoveryAnswer,
  DiscoverySubmission,
  DiscoveryUploadMetadata,
} from "@/types/brand-discovery";

type SubmissionResult = {
  databaseSaved: boolean;
  emailSent: boolean;
  configured: boolean;
};

type SubmissionEmailOptions = {
  label: string;
  subjectPrefix: string;
};

const {
  RESEND_API_KEY,
  BRAND_DISCOVERY_TO_EMAIL,
  BRAND_DISCOVERY_FROM_EMAIL,
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

const fallbackToEmail = "performance@d2dmktg.com";

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

function isUploadMetadataArray(value: DiscoveryAnswer): value is DiscoveryUploadMetadata[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "name" in item &&
        typeof item.name === "string",
    )
  );
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

    if (!isUploadMetadataArray(value)) {
      return "Not provided";
    }

    return value
      .map((file) => `${file.name}${file.type ? ` (${file.type})` : ""}${typeof file.size === "number" ? ` - ${file.size} bytes` : ""}`)
      .join(", ");
  }

  return "Not provided";
}

function answersToEmailText(
  payload: DiscoverySubmission,
  options: SubmissionEmailOptions,
) {
  const lines = [
    `${options.label} Submission`,
    "",
    `Submitted: ${payload.submittedAt}`,
    `Started: ${payload.startedAt}`,
    `Last Updated: ${payload.updatedAt}`,
    "",
    `Name: ${answerToText(payload.answers.name)}`,
    `Company: ${answerToText(payload.answers.company)}`,
    `Role: ${answerToText(payload.answers.role)}`,
    `Email: ${answerToText(payload.answers.email)}`,
    `Phone: ${answerToText(payload.answers.phone)}`,
    "",
    "All Answers",
    "",
  ];

  for (const [key, value] of Object.entries(payload.answers)) {
    lines.push(`${key}: ${answerToText(value)}`);
  }

  return lines.join("\n");
}

export function validateSubmission(payload: DiscoverySubmission) {
  const name = typeof payload.answers.name === "string" ? payload.answers.name.trim() : "";
  const company = typeof payload.answers.company === "string" ? payload.answers.company.trim() : "";
  const email = typeof payload.answers.email === "string" ? payload.answers.email.trim() : "";

  if (!name || !company || !email) {
    return "Please complete the required contact details before submitting.";
  }

  return null;
}

export function isSubmissionServiceConfigured() {
  return Boolean(RESEND_API_KEY && BRAND_DISCOVERY_FROM_EMAIL);
}

export async function handleBrandDiscoverySubmission(
  payload: DiscoverySubmission,
): Promise<SubmissionResult> {
  return handleDiscoverySubmission(payload, {
    label: "Brand Discovery",
    subjectPrefix: "New Brand Discovery",
  });
}

export async function handleExecutiveCoachingSubmission(
  payload: DiscoverySubmission,
): Promise<SubmissionResult> {
  return handleDiscoverySubmission(payload, {
    label: "Executive Coaching Discovery",
    subjectPrefix: "New Executive Coaching Discovery",
  });
}

async function handleDiscoverySubmission(
  payload: DiscoverySubmission,
  options: SubmissionEmailOptions,
): Promise<SubmissionResult> {
  if (!RESEND_API_KEY || !BRAND_DISCOVERY_FROM_EMAIL) {
    throw new Error(`Email delivery is not configured for ${options.label} submissions.`);
  }

  const resend = new Resend(RESEND_API_KEY);
  const supabase = createSupabaseAdmin();
  const emailBody = answersToEmailText(payload, options);
  const toEmail = BRAND_DISCOVERY_TO_EMAIL || fallbackToEmail;

  await resend.emails.send({
    from: BRAND_DISCOVERY_FROM_EMAIL,
    to: toEmail,
    subject: `${options.subjectPrefix}: ${answerToText(payload.answers.company)}`,
    text: emailBody,
  });

  let databaseSaved = false;

  if (supabase) {
    const { error } = await supabase.from("brand_discovery_submissions").insert({
      submitted_at: payload.submittedAt,
      answers: payload.answers,
      summaries: {},
      report_markdown: emailBody,
    });

    if (!error) {
      databaseSaved = true;
    }
  }

  return {
    databaseSaved,
    emailSent: true,
    configured: isSubmissionServiceConfigured(),
  };
}
