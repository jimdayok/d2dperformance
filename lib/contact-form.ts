import { Resend } from "resend";

export type ContactSubmission = {
  name: string;
  company?: string | null;
  email: string;
  phone?: string | null;
  message: string;
  page?: string | null;
  source?: string | null;
};

const {
  RESEND_API_KEY,
  CONTACT_FORM_TO_EMAIL,
  CONTACT_FORM_FROM_EMAIL,
  BRAND_DISCOVERY_FROM_EMAIL,
} = process.env;

function normalizeOptional(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function validateContactSubmission(payload: ContactSubmission) {
  if (!payload || typeof payload !== "object") {
    return "Invalid contact form submission.";
  }

  if (!payload.name?.trim()) {
    return "Name is required.";
  }

  if (!payload.email?.trim()) {
    return "Email is required.";
  }

  if (!isValidEmail(payload.email.trim())) {
    return "Email must be valid.";
  }

  if (!payload.message?.trim()) {
    return "Message is required.";
  }

  return null;
}

export function getContactFormConfig() {
  const to = normalizeOptional(CONTACT_FORM_TO_EMAIL) ?? "brand@d2dperformance.com";
  const preferredFrom =
    normalizeOptional(CONTACT_FORM_FROM_EMAIL) ??
    "D2D Performance <brand@d2dperformance.com>";
  const fallbackFrom = normalizeOptional(BRAND_DISCOVERY_FROM_EMAIL);

  return {
    configured: Boolean(RESEND_API_KEY),
    resendApiKeyPresent: Boolean(RESEND_API_KEY),
    to,
    preferredFrom,
    fallbackFrom,
  };
}

function buildContactEmailText(payload: ContactSubmission, submittedAt: string) {
  return [
    "New contact form submission",
    "",
    `Name: ${payload.name.trim()}`,
    `Company: ${normalizeOptional(payload.company) ?? "Not provided"}`,
    `Email: ${payload.email.trim()}`,
    `Phone: ${normalizeOptional(payload.phone) ?? "Not provided"}`,
    "",
    "Message:",
    payload.message.trim(),
    "",
    `Submitted: ${submittedAt}`,
    `Page: ${normalizeOptional(payload.page) ?? "Not provided"}`,
    `Source: ${normalizeOptional(payload.source) ?? "Not provided"}`,
  ].join("\n");
}

function buildContactEmailHtml(payload: ContactSubmission, submittedAt: string) {
  const rows = [
    ["Name", payload.name.trim()],
    ["Company", normalizeOptional(payload.company) ?? "Not provided"],
    ["Email", payload.email.trim()],
    ["Phone", normalizeOptional(payload.phone) ?? "Not provided"],
    ["Submitted", submittedAt],
    ["Page", normalizeOptional(payload.page) ?? "Not provided"],
    ["Source", normalizeOptional(payload.source) ?? "Not provided"],
  ];

  const escapedMessage = escapeHtml(payload.message.trim()).replace(/\n/g, "<br />");

  return `
    <div style="font-family: Arial, sans-serif; color: #171717; line-height: 1.6;">
      <h1 style="font-size: 22px; margin-bottom: 16px;">New contact form submission</h1>
      <table style="border-collapse: collapse; width: 100%; max-width: 720px;">
        <tbody>
          ${rows
            .map(
              ([label, value]) => `
                <tr>
                  <td style="padding: 8px 12px 8px 0; font-weight: 600; vertical-align: top;">${escapeHtml(label)}</td>
                  <td style="padding: 8px 0; vertical-align: top;">${escapeHtml(value)}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
      <h2 style="font-size: 18px; margin: 24px 0 8px;">Message</h2>
      <p style="margin: 0;">${escapedMessage}</p>
    </div>
  `;
}

export async function sendContactSubmissionEmail(payload: ContactSubmission) {
  const config = getContactFormConfig();

  if (!config.resendApiKeyPresent) {
    throw new Error("Contact form email delivery is not configured.");
  }

  const resend = new Resend(RESEND_API_KEY);
  const submittedAt = new Date().toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "long",
    timeZone: "America/Chicago",
  });
  const subjectTarget = normalizeOptional(payload.company) ?? payload.name.trim();
  const emailPayload = {
    to: config.to,
    replyTo: payload.email.trim(),
    subject: `New Contact Form Submission: ${subjectTarget}`,
    text: buildContactEmailText(payload, submittedAt),
    html: buildContactEmailHtml(payload, submittedAt),
  };
  let senderUsed = config.preferredFrom;

  try {
    await resend.emails.send({
      from: config.preferredFrom,
      ...emailPayload,
    });
  } catch (error) {
    if (!config.fallbackFrom || config.fallbackFrom === config.preferredFrom) {
      throw error;
    }

    await resend.emails.send({
      from: config.fallbackFrom,
      ...emailPayload,
    });
    senderUsed = config.fallbackFrom;
  }

  return {
    submittedAt,
    from: senderUsed,
    to: config.to,
  };
}
