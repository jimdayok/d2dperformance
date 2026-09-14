import type { D2DProduct, ProductRole } from "@/lib/d2d-platform/types";

export type ClientInstructionService = {
  product: D2DProduct;
  label: string;
  description: string;
  role: ProductRole;
};

export type ClientInstructionsEmailInput = {
  displayName: string;
  email: string;
  organizationName: string;
  loginUrl: string;
  supportEmail: string;
  services: ClientInstructionService[];
};

const roleLabels: Record<ProductRole, string> = {
  manager: "Manager",
  creator: "Creator",
  reviewer: "Reviewer",
  viewer: "Viewer",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function firstName(displayName: string) {
  return displayName.trim().split(/\s+/)[0] || "there";
}

export function buildClientInstructionsEmail(input: ClientInstructionsEmailInput) {
  const greetingName = firstName(input.displayName);
  const serviceRows = input.services.map((service) => `
    <tr>
      <td style="padding:16px 0;border-top:1px solid #e3dbd2;vertical-align:top">
        <p style="margin:0;color:#241c17;font-size:15px;font-weight:700">${escapeHtml(service.label)}</p>
        <p style="margin:5px 0 0;color:#6d6258;font-size:13px;line-height:1.55">${escapeHtml(service.description)}</p>
      </td>
      <td style="padding:16px 0 16px 18px;border-top:1px solid #e3dbd2;text-align:right;vertical-align:top;white-space:nowrap">
        <span style="display:inline-block;border-radius:999px;background:#e8f1ed;padding:6px 10px;color:#315d4b;font-size:11px;font-weight:700">${escapeHtml(roleLabels[service.role])}</span>
      </td>
    </tr>`).join("");

  const servicesText = input.services
    .map((service) => `- ${service.label} (${roleLabels[service.role]}): ${service.description}`)
    .join("\n");

  const subject = `Your D2D Account for ${input.organizationName}`;
  const text = `Hi ${greetingName},

Your access to ${input.organizationName}'s D2D Marketing tools is ready.

Sign in: ${input.loginUrl}
Use this email address: ${input.email}

HOW TO GET STARTED
1. Open the D2D Account sign-in page.
2. Choose “Sign in to D2D Account” and use ${input.email}.
3. If you still need a password, use the password setup message sent to you or choose “Forgot password” on the D2D Account sign-in screen.
4. After signing in, your assigned services appear on the “Your services” page. Open a service card to begin.

YOUR SERVICES
${servicesText}

Only the services and actions assigned to you will be available. If something looks wrong or you need help, email ${input.supportEmail}.

D2D Marketing
Secure client tools at ${input.loginUrl}`;

  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
  <body style="margin:0;background:#ece8e0;padding:0;font-family:Arial,Helvetica,sans-serif;color:#241c17">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">Your D2D Account sign-in details and assigned services.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;background:#ece8e0">
      <tr><td align="center" style="padding:28px 12px">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;overflow:hidden;border-radius:16px;background:#fbf7f1;box-shadow:0 18px 50px rgba(24,32,29,.12)">
          <tr><td style="background:#17201d;padding:32px 34px;color:#fff">
            <p style="margin:0;color:#d6a77f;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase">D2D Marketing</p>
            <h1 style="margin:12px 0 0;font-family:Georgia,serif;font-size:36px;line-height:1.08;font-weight:600">Your D2D Account is ready.</h1>
            <p style="margin:12px 0 0;color:#d9e1de;font-size:14px;line-height:1.6">Secure access for ${escapeHtml(input.organizationName)}</p>
          </td></tr>
          <tr><td style="padding:32px 34px">
            <p style="margin:0 0 16px;font-size:16px;line-height:1.7">Hi ${escapeHtml(greetingName)},</p>
            <p style="margin:0;color:#5d5148;font-size:15px;line-height:1.7">Your access to <strong style="color:#241c17">${escapeHtml(input.organizationName)}</strong>’s D2D Marketing tools is ready. Use the button below to sign in.</p>
            <p style="margin:24px 0">
              <a href="${escapeHtml(input.loginUrl)}" style="display:inline-block;border-radius:7px;background:#315d4b;padding:13px 20px;color:#fff;font-size:14px;font-weight:700;text-decoration:none">Open D2D Account</a>
            </p>
            <p style="margin:0 0 28px;color:#74685e;font-size:13px;line-height:1.6">Sign in with <strong style="color:#3a3029">${escapeHtml(input.email)}</strong>. If you still need a password, use the password setup message sent to you or choose “Forgot password” on the D2D Account sign-in screen.</p>

            <div style="margin:0 0 28px;border:1px solid #ded4c9;border-radius:12px;background:#fff;padding:22px">
              <p style="margin:0 0 14px;color:#9a5f34;font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase">How to get started</p>
              <ol style="margin:0;padding-left:20px;color:#5d5148;font-size:14px;line-height:1.75">
                <li>Open the D2D Account sign-in page.</li>
                <li>Choose <strong>Sign in to D2D Account</strong> and enter your email.</li>
                <li>On <strong>Your services</strong>, choose a service card to begin.</li>
                <li>You will see only the tools and actions assigned to you.</li>
              </ol>
            </div>

            <p style="margin:0 0 8px;color:#9a5f34;font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase">Your services</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%">${serviceRows}</table>

            <div style="margin-top:28px;border-radius:10px;background:#edf4f1;padding:18px;color:#315d4b;font-size:13px;line-height:1.65">
              Need help or see something that does not look right? Email <a href="mailto:${escapeHtml(input.supportEmail)}" style="color:#315d4b;font-weight:700">${escapeHtml(input.supportEmail)}</a>.
            </div>
          </td></tr>
          <tr><td style="background:#17201d;padding:22px 34px;color:#aebbb7;font-size:12px;line-height:1.6">
            <strong style="color:#d6a77f">D2D Marketing</strong><br>Secure client tools for marketing, brand, and web work.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}
