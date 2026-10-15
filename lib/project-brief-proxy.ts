import { NextResponse } from "next/server";

const upstreamOrigin = "https://d2dmktg.com";

export async function forwardProjectBrief(request: Request, path: "challenge" | "contact", platform: "digital" | "performance") {
  const origin = request.headers.get("origin");
  const ownOrigin = new URL(request.url).origin;
  if ((request.method === "POST" && origin !== ownOrigin) || (origin && origin !== ownOrigin)) {
    return NextResponse.json({ error: "Refresh this page and try again." }, { status: 403 });
  }
  try {
    const headers: Record<string, string> = { Origin: upstreamOrigin };
    const ip = request.headers.get("x-forwarded-for");
    if (ip) headers["X-Forwarded-For"] = ip;
    let body: string | undefined;
    if (path === "contact") {
      const payload = await request.json();
      headers["Content-Type"] = "application/json";
      body = JSON.stringify({ ...payload, platform });
    }
    const response = await fetch(`${upstreamOrigin}/api/marketing/${path}`, {
      method: request.method, headers, body, cache: "no-store", signal: AbortSignal.timeout(20000),
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "The connection was interrupted. Please try again or call 269-788-7067." }, { status: 503 });
  }
}
