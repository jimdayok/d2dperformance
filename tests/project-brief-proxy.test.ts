import { afterEach, describe, expect, it, vi } from "vitest";
import { forwardProjectBrief } from "../lib/project-brief-proxy";

afterEach(() => vi.unstubAllGlobals());

describe("platform project brief forwarding", () => {
  it("rejects another origin before contacting delivery services", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request("https://performance.d2dmktg.com/api/marketing/contact", {
      method: "POST", headers: { Origin: "https://other.example" }, body: "{}",
    });
    expect((await forwardProjectBrief(request, "contact", "performance")).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("preserves the proof and choices while recording the current platform", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ ok: true }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const request = new Request("https://performance.d2dmktg.com/api/marketing/contact", {
      method: "POST", headers: { Origin: "https://performance.d2dmktg.com", "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "digital", altcha: "signed-proof", interests: ["Website development", "App development"] }),
    });
    const response = await forwardProjectBrief(request, "contact", "performance");
    expect(response.status).toBe(201);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://d2dmktg.com/api/marketing/contact");
    expect(JSON.parse(options.body)).toEqual({ platform: "performance", altcha: "signed-proof", interests: ["Website development", "App development"] });
    expect(options.cache).toBe("no-store");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it("forwards challenge errors without pretending verification succeeded", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Unavailable" }, { status: 503 })));
    const response = await forwardProjectBrief(new Request("https://performance.d2dmktg.com/api/marketing/challenge"), "challenge", "performance");
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "Unavailable" });
  });
});
