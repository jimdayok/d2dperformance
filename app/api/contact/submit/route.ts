import {
  sendContactSubmissionEmail,
  validateContactSubmission,
} from "@/lib/contact-form";
import { safeJsonParse } from "@/lib/brand-discovery-storage";
import type { ContactSubmission } from "@/lib/contact-form";

function jsonError(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const payload = safeJsonParse<ContactSubmission | null>(bodyText, null);

    if (!payload) {
      return jsonError("Invalid contact form submission.", 400);
    }

    const validationError = validateContactSubmission(payload);
    if (validationError) {
      return jsonError(validationError, 400);
    }

    await sendContactSubmissionEmail(payload);

    return Response.json({
      ok: true,
      message: "Thanks for reaching out. Your message has been sent successfully.",
    });
  } catch (error) {
    console.error("Contact form submission failed.", error);

    return jsonError(
      "We couldn't send your message right now. Please try again in a moment.",
      500,
    );
  }
}

export async function GET() {
  return jsonError("Method not allowed.", 405);
}

export async function PUT() {
  return jsonError("Method not allowed.", 405);
}

export async function PATCH() {
  return jsonError("Method not allowed.", 405);
}

export async function DELETE() {
  return jsonError("Method not allowed.", 405);
}
