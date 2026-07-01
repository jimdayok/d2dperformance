import { sendAbandonedBrandDiscoveryNotifications } from "@/lib/submission-service";

export const dynamic = "force-dynamic";

function isAuthorizedCronRequest(request: Request) {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return Boolean(request.headers.get("x-vercel-cron"));
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return Response.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await sendAbandonedBrandDiscoveryNotifications();

    return Response.json({
      ok: true,
      message: "Brand Discovery abandoned-session check completed.",
      ...result,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[brand-discovery] event=partial-notification error", error);

    return Response.json(
      {
        ok: false,
        error: "Brand Discovery abandoned-session check failed.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
