import { Resend } from "resend";
import type { CreateEmailOptions } from "resend";

export const automatedEmailFrom = "D2D Marketing <noreply@d2dmktg.com>";
export const automatedEmailReplyTo = "noreply@d2dmktg.com";
export const automatedEmailNotice = "This is an automated message. Please do not reply. For help, email info@d2dmktg.com.";

export function automatedEmailMessage(message: CreateEmailOptions): CreateEmailOptions {
  const notice = '<p style="font-family:Arial,sans-serif;font-size:12px;color:#6d6258">' + automatedEmailNotice + '</p>';
  const html = typeof message.html === "string"
    ? /<\/body>/i.test(message.html)
      ? message.html.replace(/<\/body>/i, notice + "</body>")
      : message.html + notice
    : undefined;
  const result: CreateEmailOptions = { ...message, from: automatedEmailFrom, replyTo: automatedEmailReplyTo };
  if (typeof result.text === "string" && !result.text.includes(automatedEmailNotice)) result.text += "\n\n" + automatedEmailNotice;
  if (html !== undefined && !message.html?.includes(automatedEmailNotice)) result.html = html;
  return result;
}

// Keep provider options, attachments, domain checks and idempotency unchanged.
export class AutomatedEmailClient extends Resend {
  constructor(apiKey?: string) {
    super(process.env.D2D_NOREPLY_RESEND_API_KEY || apiKey);
    const send = this.emails.send.bind(this.emails);
    this.emails.send = (message, options) => send(automatedEmailMessage(message), options);
  }
}
