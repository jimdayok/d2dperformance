import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { emptyContent, type Snapshot } from "@/lib/digital-reporting/model";
import { renderReportPdf } from "@/lib/digital-reporting/pdf";
import {
  clientValue,
  clientChange,
} from "@/lib/digital-reporting/client-language";
const initial: Snapshot = {
  ...emptyContent(),
  organizationName: "Your business",
  organizationId: "10000000-0000-4000-8000-000000000001",
  kind: "audit",
  period: "2026-08-01",
  createdAt: "2026-10-12T12:00:00Z",
  recipients: ["example@example.com"],
  pricing: "Complimentary",
  baseline: null,
  previous: null,
  proposalReference: "",
  summary:
    "This template shows how we will explain your starting position. Before drawing conclusions, we need to confirm the information about how people find your business, use your website and contact you. Missing numbers are left open rather than treated as zero.",
  workCompleted:
    "In your completed review, D2D will list the work actually carried out for your business. This draft does not claim that a customer audit or website change has been completed.",
  nextSteps:
    "1. Confirm access to your website visitor and Google search records.\n2. Agree which forms, calls and bookings count as customer inquiries.\n3. Record a starting set of questions to check whether AI assistants recommend or link to your business.\n4. Use the confirmed findings to agree the first improvement priorities with you.",
  limitations:
    "This is a template for review, rather than a completed report for a real customer. Visitor, search, inquiry and AI-check results have not been supplied. A real report will identify the information still needed from the account owner or service provider.",
};
const monthly: Snapshot = {
  ...initial,
  kind: "monthly",
  period: "2026-10-01",
  baseline: {
    reportId: "example-baseline",
    version: 1,
    period: "2026-08-01",
    metrics: emptyContent().metrics,
  },
  previous: {
    reportId: "example-prior",
    version: 1,
    period: "2026-09-01",
    metrics: emptyContent().metrics,
  },
  summary:
    "This template shows how we will explain the month in everyday language. Your completed review will identify the most important changes, what those changes mean for your business, and what deserves attention next. This draft makes no claim that visits, visibility or inquiries increased or declined.",
  workCompleted:
    "Your completed review will name the work D2D finished during the month and explain its purpose. If something planned was delayed, we will say so and explain the next step.",
  nextSteps:
    "1. Review the latest visitor, search and inquiry information.\n2. Check whether the same AI questions produce different recommendations.\n3. Confirm progress on the work agreed in the previous review.\n4. Choose the next priorities based on what the results support.",
};
describe("client-facing report templates", () => {
  it("produces separate initial and monthly documents with the actual embedded D2D icon", async () => {
    const auditBytes = await renderReportPdf(initial, 2, {
      templateDraft: true,
    });
    const monthlyBytes = await renderReportPdf(monthly, 2, {
      templateDraft: true,
    });
    const audit = await PDFDocument.load(auditBytes),
      review = await PDFDocument.load(monthlyBytes);
    expect(audit.getTitle()).toContain("Initial Digital Review");
    expect(review.getTitle()).toContain("Monthly Digital Review");
    expect(audit.getPages()[0].node.Resources()?.toString()).toContain(
      "XObject",
    );
    expect(audit.getPageCount()).toBeGreaterThanOrEqual(4);
    expect(review.getPageCount()).toBeGreaterThanOrEqual(4);
    if (process.env.REPORT_TEMPLATE_OUTPUT_DIR) {
      mkdirSync(process.env.REPORT_TEMPLATE_OUTPUT_DIR, { recursive: true });
      writeFileSync(
        join(
          process.env.REPORT_TEMPLATE_OUTPUT_DIR,
          "D2D-Initial-Digital-Review-Template.pdf",
        ),
        auditBytes,
      );
      writeFileSync(
        join(
          process.env.REPORT_TEMPLATE_OUTPUT_DIR,
          "D2D-Monthly-Digital-Review-Template.pdf",
        ),
        monthlyBytes,
      );
    }
  });
  it("distinguishes a measure that does not apply from missing information", () => {
    expect(
      clientValue({
        ...emptyContent().metrics[0],
        status: "not_applicable",
        value: null,
      }),
    ).toBe("Not applicable");
    expect(clientValue(emptyContent().metrics[0])).toBe("Not measured");
  });
  it("explains percentage changes as percentage points rather than misleading growth percentages", () => {
    const m = {
      ...emptyContent().metrics.find((m) => m.key === "search_ctr")!,
      status: "verified" as const,
      value: 10,
    };
    expect(clientChange({ ...m, value: 12 }, m)).toBe(
      "2 percentage points higher.",
    );
    expect(clientChange({ ...m, source: "A different property" }, m)).toContain(
      "cannot be compared fairly",
    );
  });
});
