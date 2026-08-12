import { createWebsiteFeedbackAltcha } from "@/lib/website-feedback-altcha";

export async function GET(request: Request) {
  try {
    return await createWebsiteFeedbackAltcha().challengeHandler(request);
  } catch (error) {
    console.error("Website feedback challenge creation failed.", error);
    return Response.json({ error: "Verification is temporarily unavailable." }, { status: 503 });
  }
}
