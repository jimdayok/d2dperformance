import { hasTrustedPublicOrigin, untrustedOriginResponse } from "@/lib/public-origin";
import { submitFeedbackSchema } from "@/lib/website-feedback-schema";
import { submitFeedbackSession } from "@/lib/website-feedback-server";

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    if (!hasTrustedPublicOrigin(request)) return untrustedOriginResponse();
    const { sessionId } = await params;
    const input = submitFeedbackSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) return Response.json({ error: "Complete the overall satisfaction and final review questions." }, { status: 400 });
    const result = await submitFeedbackSession(sessionId, request.headers.get("x-feedback-token") ?? "", input.data);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("Website feedback submission failed.", error);
    return Response.json({ error: error instanceof Error ? error.message : "The review could not be submitted. Your saved page notes are still available." }, { status: 500 });
  }
}
