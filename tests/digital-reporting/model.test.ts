import { writeFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import {
  contentSchema,
  emptyContent,
  comparison,
  enrollmentSchema,
  previousMonth,
} from "@/lib/digital-reporting/model";
import { renderReportPdf } from "@/lib/digital-reporting/pdf";
import { PDFDocument } from "pdf-lib";
describe("evidence and comparison contracts", () => {
  it("never treats missing data as zero", () => {
    const c = emptyContent();
    expect(contentSchema.safeParse(c).success).toBe(true);
    expect(comparison(c.metrics[0], c.metrics[0])).toBe("Unavailable");
  });
  it("requires evidence and a collection timestamp for verified metrics", () => {
    const c = emptyContent();
    c.metrics[0] = { ...c.metrics[0], status: "verified", value: 12 };
    expect(contentSchema.safeParse(c).success).toBe(false);
  });
  it("rejects duplicate metrics and numeric values for unavailable measurements", () => {
    const c = emptyContent();
    c.metrics[1] = c.metrics[0];
    expect(contentSchema.safeParse(c).success).toBe(false);
    const d = emptyContent();
    d.metrics[0].value = 0;
    expect(contentSchema.safeParse(d).success).toBe(false);
  });
  it("does not calculate growth across different sources or methods", () => {
    const m = {
      ...emptyContent().metrics[0],
      value: 10,
      status: "verified" as const,
      evidence: "source.csv",
      measuredAt: "2026-10-01T00:00:00Z",
    };
    expect(comparison({ ...m, value: 20 }, m)).toBe("+100.0%");
    expect(comparison({ ...m, method: "different" }, m)).toContain(
      "Not comparable",
    );
    expect(comparison(m, { ...m, value: 0 })).toContain("undefined");
  });
  it("validates fee arrangements and recipient email addresses", () => {
    const e = {
      organizationId: "10000000-0000-4000-8000-000000000001",
      enabled: true,
      monthly: true,
      recipients: ["client@example.com"],
      auditPricing: "paid",
      auditFee: 0,
      startMonth: "2026-10-01",
      proposalReference: "D2D-123",
    };
    expect(enrollmentSchema.safeParse(e).success).toBe(false);
    expect(enrollmentSchema.safeParse({ ...e, auditFee: 150 }).success).toBe(
      true,
    );
  });
  it("selects the immediately preceding month across year boundaries", () => {
    expect(previousMonth("2026-01-01")).toBe("2025-12-01");
  });
  it("renders a real paginated PDF even with lengthy evidence and Unicode", async () => {
    const content = emptyContent();
    content.summary = "Client’s assessment “+” 😀 ".repeat(50);
    const bytes = await renderReportPdf(
      {
        ...content,
        organizationName: "Illustrative client — QA",
        organizationId: "10000000-0000-4000-8000-000000000001",
        kind: "audit",
        period: "2026-09-01",
        createdAt: "2026-10-12T12:00:00Z",
        recipients: ["example@example.com"],
        pricing: "Complimentary",
        baseline: null,
        previous: null,
        proposalReference: "QA only",
      },
      1,
    );
    if (process.env.REPORT_PDF_QA_OUTPUT) {
      const sample = {
        ...emptyContent(),
        summary:
          "This illustrative draft demonstrates D2D's monthly reporting format. It is a layout sample, not a customer audit. No analytics or performance claims have been supplied.",
        workCompleted:
          "Sample only. Customer-specific completed work will be entered by the account team and reviewed before approval.",
        nextSteps:
          "Connect the customer's measurement sources, document the agreed scope, and review the evidence before establishing the initial audit baseline.",
      };
      writeFileSync(
        process.env.REPORT_PDF_QA_OUTPUT,
        await renderReportPdf(
          {
            ...sample,
            organizationName: "Illustrative Client | Layout Sample",
            organizationId: "10000000-0000-4000-8000-000000000001",
            kind: "audit",
            period: "2026-09-01",
            createdAt: "2026-10-12T12:00:00Z",
            recipients: ["example@example.com"],
            pricing: "Complimentary (illustrative)",
            baseline: null,
            previous: null,
            proposalReference:
              "Illustrative proposal reference - not an actual engagement",
          },
          1,
        ),
      );
    }
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThanOrEqual(6);
    expect(bytes.subarray(0, 4).toString()).toBe("%PDF");
  });
});
