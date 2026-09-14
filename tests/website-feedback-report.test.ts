import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createMarkupOverlaySvg, generateWebsiteFeedbackPdf } from "@/lib/website-feedback-report";

const annotations = [
  {
    id: "draw-1",
    kind: "draw" as const,
    category: "modify_text" as const,
    x: 0.1,
    y: 0.2,
    width: 0.35,
    height: 0.14,
    points: [{ x: 0.1, y: 0.2 }, { x: 0.25, y: 0.32 }, { x: 0.45, y: 0.22 }],
    text: "Replace this headline with the approved copy.",
  },
  {
    id: "arrow-1",
    kind: "arrow" as const,
    category: "change_picture" as const,
    x: 0.55,
    y: 0.25,
    width: 0.28,
    height: 0.2,
    points: [{ x: 0.55, y: 0.25 }, { x: 0.83, y: 0.45 }],
    text: "Use the new exterior photograph here.",
  },
];

describe("website feedback PDF report", () => {
  it("renders freehand strokes, arrows, and numbered pins into the markup overlay", () => {
    const svg = createMarkupOverlaySvg(annotations, 1440, 720);
    expect(svg).toContain("<polyline");
    expect(svg).toContain("marker-end=\"url(#arrowhead)\"");
    expect(svg).toContain(">1</text>");
    expect(svg).toContain(">2</text>");
  });

  it("creates a viewable PDF with the marked page and complete notes", async () => {
    const screenshot = await sharp({ create: { width: 1440, height: 720, channels: 3, background: "#e6eee9" } })
      .jpeg({ quality: 75 })
      .toBuffer();
    const report = await generateWebsiteFeedbackPdf(
      { id: "session-1", company: "Acadia Eye Center", client_name: "Client Reviewer", client_email: "reviewer@example.com" },
      [{ url: "https://example.com/", page_title: "Homepage", page_score: 4, commentary: "Keep the current navigation.", answers: {}, annotations }],
      { satisfactionScore: 8, approvalStatus: "needs_revision", overallAnswers: { must_change: "Please address the marked items." } },
      process.env.WRITE_FEEDBACK_PDF_FIXTURE ? undefined : { screenshots: [screenshot] },
    );
    const parsed = await PDFDocument.load(report);
    expect(report.subarray(0, 4).toString()).toBe("%PDF");
    expect(parsed.getPageCount()).toBe(3);
    expect(parsed.getTitle()).toBe("Website Feedback - Acadia Eye Center");
    if (process.env.WRITE_FEEDBACK_PDF_FIXTURE) {
      await mkdir("output/pdf", { recursive: true });
      await writeFile("output/pdf/website-feedback-markup-sample.pdf", report);
    }
  });
});
import { mkdir, writeFile } from "node:fs/promises";
