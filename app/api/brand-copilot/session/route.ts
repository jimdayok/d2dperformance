import { ensureBrandCopilotSession } from "@/lib/brand-copilot";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await ensureBrandCopilotSession();

    return Response.json({
      status: "ready",
      expiresAt: new Date(session.exp).toISOString(),
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    return Response.json(
      { error: "session_bootstrap_failed", message: "Unable to initialize protected session." },
      { status: 500 },
    );
  }
}
