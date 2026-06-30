import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import type {
  DiscoveryFormValues,
  DiscoveryAnswer,
  DiscoverySubmission,
  DiscoveryUploadMetadata,
} from "@/types/brand-discovery";
import { brandDiscoverySections } from "@/lib/brand-discovery-data";
import { safeJsonParse } from "@/lib/brand-discovery-storage";

type SubmissionResult = {
  databaseSaved: boolean;
  emailSent: boolean;
  configured: boolean;
};

type SubmissionEmailOptions = {
  label: string;
  subjectPrefix: string;
  recipients?: string[];
};

type DiscoveryInsight = {
  summaryHeading: string;
  summaryBody: string;
  summaryBullets: string[];
  researchHeading: string;
  researchBody: string;
  researchBullets: string[];
  sources: string[];
};

const {
  RESEND_API_KEY,
  BRAND_DISCOVERY_TO_EMAIL,
  BRAND_DISCOVERY_NOTIFICATION_EMAIL,
  BRAND_DISCOVERY_FROM_EMAIL,
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} = process.env;

const brandDiscoveryDefaultRecipients = [
  "jim@d2dmktg.com",
  "andrea@d2dmktg.com",
];

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

const questionLabels = Object.fromEntries(
  brandDiscoverySections.flatMap((section) =>
    section.questions.map((question) => [question.id, question.label]),
  ),
);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatQuestionAnswerRows(answers: DiscoveryFormValues) {
  return Object.entries(answers)
    .map(([key, value]) => ({
      label: questionLabels[key] || key,
      answer: answerToText(value),
    }))
    .map(
      (item) => `
        <tr>
          <td style="padding:14px 16px; border-bottom:1px solid #e7ddd2; vertical-align:top; width:34%; font-size:13px; line-height:1.55; color:#6d6258; text-transform:uppercase; letter-spacing:0.08em;">
            ${escapeHtml(item.label)}
          </td>
          <td style="padding:14px 16px; border-bottom:1px solid #e7ddd2; vertical-align:top; font-size:15px; line-height:1.7; color:#151515;">
            ${escapeHtml(item.answer)}
          </td>
        </tr>
      `,
    )
    .join("");
}

function renderBulletList(items: string[]) {
  if (items.length === 0) {
    return "";
  }

  return `
    <ul style="margin:14px 0 0; padding-left:18px; color:#151515;">
      ${items
        .map(
          (item) => `
            <li style="margin:0 0 10px; font-size:15px; line-height:1.7;">
              ${escapeHtml(item)}
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function buildBeautifulEmailHtml(
  payload: DiscoverySubmission,
  options: SubmissionEmailOptions,
  insight: DiscoveryInsight | null,
) {
  const company = answerToText(payload.answers.company);
  const name = answerToText(payload.answers.name);
  const role = answerToText(payload.answers.role);
  const email = answerToText(payload.answers.email);
  const phone = answerToText(payload.answers.phone);
  const questionRows = formatQuestionAnswerRows(payload.answers);

  return `
    <div style="background:#f6f0e8; padding:32px 20px; font-family: 'IBM Plex Sans', Arial, sans-serif; color:#151515;">
      <div style="max-width:980px; margin:0 auto; background:#fbf6ef; border:1px solid rgba(21,21,21,0.12);">
        <div style="padding:28px 32px; border-bottom:1px solid rgba(21,21,21,0.12); background:linear-gradient(180deg, rgba(255,255,255,0.45), rgba(239,230,218,0.65));">
          <div style="font-size:11px; letter-spacing:0.32em; text-transform:uppercase; color:#9a5f34; font-weight:600;">D2D Performance</div>
          <h1 style="margin:16px 0 10px; font-family: Georgia, 'Times New Roman', serif; font-size:42px; line-height:1.02; letter-spacing:-0.04em; font-weight:600; color:#151515;">
            ${escapeHtml(options.label)}
          </h1>
          <p style="margin:0; max-width:720px; font-size:16px; line-height:1.8; color:#6d6258;">
            A complete discovery record with contact details, raw answers, AI summary, and contextual research.
          </p>
        </div>

        <div style="padding:28px 32px; border-bottom:1px solid rgba(21,21,21,0.12);">
          <div style="display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px;">
            <div>
              <div style="font-size:11px; letter-spacing:0.24em; text-transform:uppercase; color:#9a5f34; font-weight:600;">Primary Contact</div>
              <p style="margin:10px 0 0; font-size:18px; line-height:1.6; color:#151515;">${escapeHtml(name)}</p>
            </div>
            <div>
              <div style="font-size:11px; letter-spacing:0.24em; text-transform:uppercase; color:#9a5f34; font-weight:600;">Company</div>
              <p style="margin:10px 0 0; font-size:18px; line-height:1.6; color:#151515;">${escapeHtml(company)}</p>
            </div>
            <div>
              <div style="font-size:11px; letter-spacing:0.24em; text-transform:uppercase; color:#9a5f34; font-weight:600;">Role</div>
              <p style="margin:10px 0 0; font-size:16px; line-height:1.6; color:#151515;">${escapeHtml(role)}</p>
            </div>
            <div>
              <div style="font-size:11px; letter-spacing:0.24em; text-transform:uppercase; color:#9a5f34; font-weight:600;">Email</div>
              <p style="margin:10px 0 0; font-size:16px; line-height:1.6; color:#151515;">${escapeHtml(email)}</p>
            </div>
            <div>
              <div style="font-size:11px; letter-spacing:0.24em; text-transform:uppercase; color:#9a5f34; font-weight:600;">Phone</div>
              <p style="margin:10px 0 0; font-size:16px; line-height:1.6; color:#151515;">${escapeHtml(phone)}</p>
            </div>
            <div>
              <div style="font-size:11px; letter-spacing:0.24em; text-transform:uppercase; color:#9a5f34; font-weight:600;">Timeline</div>
              <p style="margin:10px 0 0; font-size:16px; line-height:1.6; color:#151515;">
                Started ${escapeHtml(payload.startedAt)}<br />
                Updated ${escapeHtml(payload.updatedAt)}<br />
                Submitted ${escapeHtml(payload.submittedAt)}
              </p>
            </div>
          </div>
        </div>

        <div style="padding:28px 32px; border-bottom:1px solid rgba(21,21,21,0.12);">
          <div style="font-size:11px; letter-spacing:0.32em; text-transform:uppercase; color:#9a5f34; font-weight:600;">AI Reading</div>
          <h2 style="margin:14px 0 0; font-family: Georgia, 'Times New Roman', serif; font-size:30px; line-height:1.08; letter-spacing:-0.04em; color:#151515;">
            ${escapeHtml(insight?.summaryHeading || "Summary unavailable")}
          </h2>
          <p style="margin:16px 0 0; font-size:16px; line-height:1.8; color:#6d6258;">
            ${escapeHtml(
              insight?.summaryBody ||
                "The AI summary could not be generated for this message. The raw answers are still included in full below.",
            )}
          </p>
          ${renderBulletList(insight?.summaryBullets || [])}
        </div>

        <div style="padding:28px 32px; border-bottom:1px solid rgba(21,21,21,0.12); background:#f3ece3;">
          <div style="font-size:11px; letter-spacing:0.32em; text-transform:uppercase; color:#9a5f34; font-weight:600;">Company / Founder / Industry Research</div>
          <h2 style="margin:14px 0 0; font-family: Georgia, 'Times New Roman', serif; font-size:30px; line-height:1.08; letter-spacing:-0.04em; color:#151515;">
            ${escapeHtml(insight?.researchHeading || "Research snapshot")}
          </h2>
          <p style="margin:16px 0 0; font-size:16px; line-height:1.8; color:#6d6258;">
            ${escapeHtml(
              insight?.researchBody ||
                "Research could not be completed for this message. The raw discovery answers remain the source of truth below.",
            )}
          </p>
          ${renderBulletList(insight?.researchBullets || [])}
          ${
            insight?.sources?.length
              ? `
            <div style="margin-top:18px; font-size:13px; line-height:1.7; color:#6d6258;">
              <strong style="color:#151515;">Sources</strong><br />
              ${insight.sources.map((source) => escapeHtml(source)).join("<br />")}
            </div>
          `
              : ""
          }
        </div>

        <div style="padding:28px 32px;">
          <div style="font-size:11px; letter-spacing:0.32em; text-transform:uppercase; color:#9a5f34; font-weight:600;">All Questions and Answers</div>
          <table style="width:100%; margin-top:18px; border-collapse:collapse; background:white; border:1px solid #e7ddd2;">
            ${questionRows}
          </table>
        </div>
      </div>
    </div>
  `;
}

function answersToEmailText(
  payload: DiscoverySubmission,
  options: SubmissionEmailOptions,
  insight?: DiscoveryInsight | null,
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
    "AI Summary",
    "",
    insight?.summaryHeading || "Summary unavailable",
    insight?.summaryBody ||
      "The AI summary could not be generated for this message.",
    "",
    ...(insight?.summaryBullets?.length
      ? insight.summaryBullets.map((item) => `- ${item}`)
      : []),
    "",
    "Research",
    "",
    insight?.researchHeading || "Research snapshot",
    insight?.researchBody ||
      "Research could not be completed for this message.",
    "",
    ...(insight?.researchBullets?.length
      ? insight.researchBullets.map((item) => `- ${item}`)
      : []),
    "",
    ...(insight?.sources?.length
      ? ["Sources", "", ...insight.sources, ""]
      : []),
    "",
    "All Answers",
    "",
  ];

  for (const [key, value] of Object.entries(payload.answers)) {
    lines.push(`${questionLabels[key] || key}: ${answerToText(value)}`);
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
  return Boolean(RESEND_API_KEY && BRAND_DISCOVERY_FROM_EMAIL && process.env.OPENAI_API_KEY);
}

function getNotificationRecipients(explicitRecipients?: string[]) {
  if (explicitRecipients && explicitRecipients.length > 0) {
    return Array.from(
      new Set(
        explicitRecipients
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean),
      ),
    );
  }

  const envRecipients = [
    BRAND_DISCOVERY_TO_EMAIL,
    BRAND_DISCOVERY_NOTIFICATION_EMAIL,
  ]
    .filter(Boolean)
    .flatMap((value) => value!.split(/[;,]/))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const manualRecipients = (explicitRecipients ?? [])
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(
    new Set([
      ...manualRecipients,
      ...envRecipients,
      ...brandDiscoveryDefaultRecipients,
    ]),
  );
}

export async function handleBrandDiscoverySubmission(
  payload: DiscoverySubmission,
): Promise<SubmissionResult> {
  return handleDiscoverySubmission(payload, {
    label: "Brand Discovery",
    subjectPrefix: "New Brand Discovery",
    recipients: brandDiscoveryDefaultRecipients,
  });
}

export async function handleBrandDiscoveryProgress(
  payload: DiscoverySubmission,
): Promise<SubmissionResult> {
  return handleDiscoverySubmission(payload, {
    label: "Brand Discovery Progress",
    subjectPrefix: "Brand Discovery In Progress",
    recipients: brandDiscoveryDefaultRecipients,
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
  const insight = await generateDiscoveryInsight(payload, options.label);
  const emailBody = answersToEmailText(payload, options, insight);
  const emailHtml = buildBeautifulEmailHtml(payload, options, insight);
  const recipients = getNotificationRecipients(options.recipients);

  await resend.emails.send({
    from: BRAND_DISCOVERY_FROM_EMAIL,
    to: recipients,
    subject: `${options.subjectPrefix}: ${answerToText(payload.answers.company)}`,
    text: emailBody,
    html: emailHtml,
  });

  let databaseSaved = false;

  if (supabase && options.label === "Brand Discovery") {
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

async function generateDiscoveryInsight(
  payload: DiscoverySubmission,
  label: string,
): Promise<DiscoveryInsight | null> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_BRAND_DISCOVERY_MODEL || "gpt-5-mini";

  if (!OPENAI_API_KEY) {
    return null;
  }

  const researchPrompt = {
    submissionType: label,
    company: answerToText(payload.answers.company),
    contactName: answerToText(payload.answers.name),
    contactRole: answerToText(payload.answers.role),
    contactEmail: answerToText(payload.answers.email),
    answers: Object.fromEntries(
      Object.entries(payload.answers).map(([key, value]) => [
        questionLabels[key] || key,
        answerToText(value),
      ]),
    ),
  };

  const systemPrompt = [
    "You are preparing an internal advisory intake brief for D2D Performance.",
    "Return strict JSON only.",
    "Create two sections:",
    "1) an executive summary of the discovery answers",
    "2) researched context about the company, the founder or primary contact, and the industry.",
    "Use web search to research the company, the named contact, and the industry when possible.",
    "Be honest about uncertainty and never invent facts.",
    "If research is limited, say so clearly.",
    "Use these JSON keys exactly:",
    "summaryHeading, summaryBody, summaryBullets, researchHeading, researchBody, researchBullets, sources.",
    "summaryBullets and researchBullets must be arrays of short strings.",
    "sources must be an array of plain URL strings.",
  ].join(" ");

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        tools: [{ type: "web_search" }],
        max_output_tokens: 2200,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify(researchPrompt),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return await generateFallbackSummary(payload, label, model, OPENAI_API_KEY);
    }

    const responseJson = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };

    const rawText = extractOutputText(responseJson);
    return safeJsonParse<DiscoveryInsight | null>(sanitizeResponseText(rawText), null);
  } catch {
    return await generateFallbackSummary(payload, label, model, OPENAI_API_KEY);
  }
}

function sanitizeResponseText(text: string) {
  return text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
}

function extractOutputText(responseJson: {
  output_text?: string;
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
}) {
  if (typeof responseJson.output_text === "string" && responseJson.output_text.trim()) {
    return responseJson.output_text.trim();
  }

  return (responseJson.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text as string)
    .join("\n")
    .trim();
}

async function generateFallbackSummary(
  payload: DiscoverySubmission,
  label: string,
  model: string,
  apiKey: string,
): Promise<DiscoveryInsight | null> {
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_output_tokens: 1600,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text: [
                  "Return strict JSON only.",
                  "Summarize the discovery answers for an internal advisory team.",
                  "If web research is unavailable, say that clearly in the research section.",
                  "Use these keys exactly:",
                  "summaryHeading, summaryBody, summaryBullets, researchHeading, researchBody, researchBullets, sources.",
                ].join(" "),
              },
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  submissionType: label,
                  company: answerToText(payload.answers.company),
                  contactName: answerToText(payload.answers.name),
                  contactRole: answerToText(payload.answers.role),
                  answers: Object.fromEntries(
                    Object.entries(payload.answers).map(([key, value]) => [
                      questionLabels[key] || key,
                      answerToText(value),
                    ]),
                  ),
                }),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const responseJson = (await response.json()) as {
      output_text?: string;
      output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    };
    return safeJsonParse<DiscoveryInsight | null>(
      sanitizeResponseText(extractOutputText(responseJson)),
      null,
    );
  } catch {
    return null;
  }
}
