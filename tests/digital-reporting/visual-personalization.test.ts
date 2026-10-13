import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import {
  normalizeClientLogo,
  maxLogoUploadBytes,
} from "@/lib/digital-reporting/branding";
import { chartPoints } from "@/lib/digital-reporting/graphics";
import { emptyContent, type Snapshot } from "@/lib/digital-reporting/model";
import { renderReportPdf } from "@/lib/digital-reporting/pdf";
function examples() {
  const sampleValues: Record<string, number> = {
    users: 1200,
    sessions: 1500,
    organic_clicks: 320,
    search_impressions: 8000,
    search_ctr: 4,
    search_position: 12,
    ai_mentions: 20,
    ai_citations: 10,
    engagement_rate: 58,
    views: 3100,
    leads: 24,
    forms: 12,
    calls: 9,
    bookings: 3,
    conversion_rate: 1.6,
    lcp: 2.8,
    inp: 180,
    cls: 0.06,
    indexable_pages: 28,
  };
  const content = emptyContent();
  content.metrics = content.metrics.map((m) => ({
    ...m,
    value: sampleValues[m.key],
    status: "verified" as const,
    source: "Illustrative design data",
    evidence: "Fictional review example; not a customer measurement",
    measuredAt: "2026-10-12T12:00:00Z",
    method: "Illustrative design figures only",
    reason: "",
  }));
  const initial: Snapshot = {
    ...content,
    organizationName: "Alford Custom Builders",
    organizationId: "10000000-0000-4000-8000-000000000001",
    kind: "audit",
    period: "2026-08-01",
    createdAt: "2026-10-12T12:00:00Z",
    recipients: ["example@example.com"],
    pricing: "Complimentary (design example)",
    baseline: null,
    previous: null,
    proposalReference: "",
    summary:
      "This personalized design example shows how we will explain Alford's starting position in everyday language. The figures demonstrate the layout; they are not Alford's actual visitor, search or inquiry results.",
    workCompleted:
      "This section will describe the review work D2D actually completed for Alford. No customer audit, website change or business result is claimed by this design example.",
    nextSteps:
      "1. Confirm access to website visitor and Google search records.\n2. Agree which customer inquiries should be counted.\n3. Review the AI questions and website experience checks.\n4. Use the confirmed findings to choose the first priorities together.",
    limitations:
      "All figures in this review copy are illustrative. A client report will use confirmed account records, identify missing information and describe the work actually completed.",
  };
  const previousValues: Record<string, number> = {
    users: 1450,
    sessions: 1850,
    organic_clicks: 390,
    search_impressions: 9000,
    search_ctr: 4.33,
    search_position: 11,
    ai_mentions: 25,
    ai_citations: 15,
    engagement_rate: 60,
    views: 3700,
    leads: 29,
    forms: 15,
    calls: 10,
    bookings: 4,
    conversion_rate: 1.57,
    lcp: 2.6,
    inp: 175,
    cls: 0.05,
    indexable_pages: 30,
  };
  const currentValues: Record<string, number> = {
    users: 1800,
    sessions: 2250,
    organic_clicks: 480,
    search_impressions: 10400,
    search_ctr: 4.62,
    search_position: 10,
    ai_mentions: 30,
    ai_citations: 20,
    engagement_rate: 62,
    views: 4500,
    leads: 36,
    forms: 18,
    calls: 12,
    bookings: 6,
    conversion_rate: 1.6,
    lcp: 2.4,
    inp: 170,
    cls: 0.05,
    indexable_pages: 31,
  };
  const previous = {
    reportId: "example-prior",
    version: 1,
    period: "2026-09-01",
    metrics: content.metrics.map((m) => ({
      ...m,
      value: previousValues[m.key],
    })),
  };
  const monthly: Snapshot = {
    ...initial,
    kind: "monthly",
    period: "2026-10-01",
    metrics: content.metrics.map((m) => ({
      ...m,
      value: currentValues[m.key],
    })),
    baseline: {
      reportId: "example-audit",
      version: 1,
      period: initial.period,
      metrics: content.metrics,
    },
    previous,
    summary:
      "This example shows the visual comparison between the first review, the previous month and the current month. The sample bars rise across the three periods so you can review the graph design. This is not a claim that Alford's performance increased.",
    workCompleted:
      "The completed client review will list the work D2D finished, why it mattered, and anything that was delayed. This design example claims no completed client work.",
    nextSteps:
      "1. Review the latest visitor, search and inquiry records.\n2. Check the agreed AI questions again.\n3. Confirm progress on last month's priorities.\n4. Choose the next steps supported by the actual results.",
  };
  return { initial, monthly };
}
describe("graphs and customer branding", () => {
  it("plots only a starting result in the first review and comparable periods in monthly reviews", () => {
    const { initial, monthly } = examples();
    expect(chartPoints(initial, "users").map((p) => p.value)).toEqual([1200]);
    expect(chartPoints(monthly, "users").map((p) => p.value)).toEqual([
      1200, 1450, 1800,
    ]);
  });
  it("does not turn missing data into zero or chart results with different counting rules", () => {
    const { monthly } = examples();
    monthly.metrics.find((m) => m.key === "users")!.method =
      "Changed visitor counting";
    expect(chartPoints(monthly, "users").map((p) => p.value)).toEqual([
      null,
      null,
      1800,
    ]);
    const missing = {
      ...monthly,
      metrics: emptyContent().metrics,
      baseline: null,
      previous: null,
    };
    expect(chartPoints(missing, "users").every((p) => p.value === null)).toBe(
      true,
    );
  });
  it("keeps a verified zero distinct from missing information", () => {
    const { initial } = examples();
    initial.metrics.find((m) => m.key === "leads")!.value = 0;
    expect(chartPoints(initial, "leads")[0]).toMatchObject({
      value: 0,
      reason: null,
    });
  });
  it("rejects SVG, invalid images and oversized logo uploads", async () => {
    await expect(
      normalizeClientLogo(Buffer.from("<svg/>"), "logo.svg"),
    ).rejects.toThrow("PNG");
    await expect(
      normalizeClientLogo(Buffer.alloc(maxLogoUploadBytes + 1), "huge.png"),
    ).rejects.toThrow("2 MB");
  });
  it("normalizes an uploaded logo to a bounded PNG with an integrity digest", async () => {
    const bytes = await sharp({
      create: { width: 1400, height: 700, channels: 4, background: "#234567" },
    })
      .jpeg()
      .toBuffer();
    const logo = await normalizeClientLogo(bytes, "client.jpg");
    const meta = await sharp(Buffer.from(logo.pngBase64, "base64")).metadata();
    expect(meta.format).toBe("png");
    expect(meta.width).toBeLessThanOrEqual(1000);
    expect(meta.height).toBeLessThanOrEqual(500);
    expect(logo.sha256).toMatch(/^[a-f0-9]{64}$/);
  });
  it("prevents sample-data mode from being used as an ordinary customer report", async () => {
    await expect(
      renderReportPdf(examples().initial, 3, { illustrativeData: true }),
    ).rejects.toThrow("clearly marked");
  });
  it("personalizes both review examples with Alford's logo and real graphs", async () => {
    const { initial, monthly } = examples();
    const logo = await normalizeClientLogo(
      readFileSync("tests/digital-reporting/fixtures/alford-logo.png"),
      "Alford-logo.png",
    );
    initial.clientLogo = logo;
    monthly.clientLogo = logo;
    const first = await renderReportPdf(initial, 3, {
      templateDraft: true,
      illustrativeData: true,
    });
    const review = await renderReportPdf(monthly, 3, {
      templateDraft: true,
      illustrativeData: true,
    });
    expect(
      (await PDFDocument.load(first)).getPageCount(),
    ).toBeGreaterThanOrEqual(7);
    expect((await PDFDocument.load(review)).getTitle()).toContain("Alford");
    if (process.env.REPORT_TEMPLATE_OUTPUT_DIR) {
      mkdirSync(process.env.REPORT_TEMPLATE_OUTPUT_DIR, { recursive: true });
      writeFileSync(
        join(
          process.env.REPORT_TEMPLATE_OUTPUT_DIR,
          "Alford-Initial-Digital-Review-Design.pdf",
        ),
        first,
      );
      writeFileSync(
        join(
          process.env.REPORT_TEMPLATE_OUTPUT_DIR,
          "Alford-Monthly-Digital-Review-Design.pdf",
        ),
        review,
      );
    }
  });
});
