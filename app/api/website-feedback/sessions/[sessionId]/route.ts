import { getFeedbackSession } from "@/lib/website-feedback-server";

function tokenFrom(request: Request) {
  return request.headers.get("x-feedback-token") ?? "";
}

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const result = await getFeedbackSession(sessionId, tokenFrom(request));
    return Response.json({ ok: true, ...result });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Review not found." }, { status: 404 });
  }
}
