import { hasTrustedPublicOrigin, untrustedOriginResponse } from "@/lib/public-origin";
import { startFeedbackSchema } from "@/lib/website-feedback-schema";
import { createWebsiteFeedbackAltcha } from "@/lib/website-feedback-altcha";
import { createFeedbackSession } from "@/lib/website-feedback-server";

export async function POST(request: Request) {
  try {
    if (!hasTrustedPublicOrigin(request)) return untrustedOriginResponse();
    const verification = await createWebsiteFeedbackAltcha().middleware(request.clone(), false);
    const input = startFeedbackSchema.safeParse(await request.json().catch(() => null));
    if (!input.success) return Response.json({ error: "Complete your contact details, website address, and verification." }, { status: 400 });
    if (verification instanceof Response || verification.error || !verification.verification?.verified) {
      return Response.json({ error: "Human verification did not complete. Please try the fresh challenge." }, { status: 403 });
    }
    const session = await createFeedbackSession(input.data);
    return Response.json({ ok: true, session });
  } catch (error) {
    console.error("Website feedback session creation failed.", error);
    return Response.json({ error: error instanceof Error ? error.message : "The review could not be started." }, { status: 500 });
  }
}
