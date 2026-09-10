import "server-only";

import { Resend } from "resend";
import {
  buildClientInstructionsEmail,
  type ClientInstructionService,
} from "@/lib/d2d-platform/client-instructions-email-template";

function instructionsFromEmail() {
  return process.env.PORTAL_INSTRUCTIONS_FROM_EMAIL
    ?? process.env.BRAND_DISCOVERY_FROM_EMAIL
    ?? process.env.CONTACT_FORM_FROM_EMAIL;
}

export function isClientInstructionsEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && instructionsFromEmail());
}

export async function sendClientInstructionsEmail(input: {
  displayName: string;
  email: string;
  organizationName: string;
  services: ClientInstructionService[];
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = instructionsFromEmail();
  if (!apiKey || !from) {
    throw new Error("Client instruction email delivery is not configured yet.");
  }

  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? "https://webadmin.d2dmktg.com";
  const loginUrl = new URL("/portal/login", portalUrl).toString();
  const supportEmail = process.env.PORTAL_SUPPORT_EMAIL
    ?? process.env.CONTACT_FORM_TO_EMAIL
    ?? "andrea@d2dmktg.com";
  const message = buildClientInstructionsEmail({ ...input, loginUrl, supportEmail });
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: input.email,
    replyTo: supportEmail,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
  if (error) throw new Error(`Client instruction email was rejected: ${error.message}`);
  return { id: data?.id ?? null };
}
