import { hasTrustedPublicOrigin, untrustedOriginResponse } from "@/lib/public-origin";
import { pageFeedbackSchema } from "@/lib/website-feedback-schema";
import { saveFeedbackPage } from "@/lib/website-feedback-server";

export async function PUT(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    if (!hasTrustedPublicOrigin(request)) return untrustedOriginResponse();
    const { sessionId } = await params;
    const input = pageFeedbackSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) return Response.json({ error: "Complete the page score and feedback before saving." }, { status: 400 });
    const page = await saveFeedbackPage(sessionId, request.headers.get("x-feedback-token") ?? "", input.data);
    return Response.json({ ok: true, page });
  } catch (error) {
    console.error("Website feedback page save failed.", error);
    return Response.json({ error: error instanceof Error ? error.message : "Page feedback could not be saved." }, { status: 500 });
  }
}
