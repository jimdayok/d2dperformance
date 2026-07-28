import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import nextConfig from "@/next.config";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { hasTrustedPublicOrigin } from "@/lib/public-origin";
import { companyName, siteUrl } from "@/lib/site-data";
import { proxy } from "@/proxy";

describe("D2D Marketing production migration", () => {
  it("uses the approved brand and canonical origin", () => {
    expect(companyName).toBe("D2D Marketing");
    expect(siteUrl).toBe("https://performance.d2dmktg.com");
  });

  it("publishes only canonical sitemap URLs", () => {
    const entries = sitemap();

    expect(entries.length).toBeGreaterThanOrEqual(12);
    expect(entries.every((entry) => entry.url.startsWith(`${siteUrl}/`))).toBe(true);
    expect(entries.map((entry) => entry.url)).toEqual(
      expect.arrayContaining([
        `${siteUrl}/`,
        `${siteUrl}/privacy-policy`,
        `${siteUrl}/sign-up-for-our-newsletter`,
        `${siteUrl}/terms-of-use`,
      ]),
    );
  });

  it("points robots at the canonical sitemap and excludes private routes", () => {
    const policy = robots();

    expect(policy.sitemap).toBe(`${siteUrl}/sitemap.xml`);
    expect(policy.rules).toEqual(
      expect.objectContaining({
        disallow: ["/portal", "/api/"],
      }),
    );
  });

  it("has an explicit permanent legacy-path map", async () => {
    const redirects = await nextConfig.redirects?.();

    expect(redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/performance",
          destination: "/",
          permanent: true,
        }),
        expect.objectContaining({
          source: "/why-d2d-1",
          destination: "/about",
          permanent: true,
        }),
        expect.objectContaining({
          source: "/better-together",
          destination: "/about#better-together",
          permanent: true,
        }),
      ]),
    );
  });

  it.each([
    "d2dperformance.com",
    "www.d2dperformance.com",
  ])("redirects %s to the Performance subsite while preserving path and query", async (host) => {
    const request = new NextRequest(
      `https://${host}/services/example?campaign=migration`,
      { headers: { host } },
    );
    const response = await proxy(request);

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://performance.d2dmktg.com/services/example?campaign=migration",
    );
  });

  it("redirects the Marketing www hostname to the Marketing apex", async () => {
    const host = "www.d2dmktg.com";
    const request = new NextRequest(
      `https://${host}/services/example?campaign=migration`,
      { headers: { host } },
    );
    const response = await proxy(request);

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://d2dmktg.com/services/example?campaign=migration",
    );
  });

  it("accepts same-origin and canonical form requests but rejects foreign origins", () => {
    expect(
      hasTrustedPublicOrigin(
        new Request("https://preview.example/api/contact/submit", {
          headers: { origin: "https://preview.example" },
        }),
      ),
    ).toBe(true);
    expect(
      hasTrustedPublicOrigin(
        new Request("https://preview.example/api/contact/submit", {
          headers: { origin: "https://performance.d2dmktg.com" },
        }),
      ),
    ).toBe(true);
    expect(
      hasTrustedPublicOrigin(
        new Request("https://performance.d2dmktg.com/api/contact/submit", {
          headers: { origin: "https://example.com" },
        }),
      ),
    ).toBe(false);
  });
});
