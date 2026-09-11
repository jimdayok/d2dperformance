import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  markupNoteSchema,
  normalizeReviewUrl,
  overallQuestions,
  pageFeedbackSchema,
  pageQuestions,
  submitFeedbackSchema,
} from "@/lib/website-feedback-schema";

describe("website feedback workflow", () => {
  it("provides a complete first-iteration marketing review", () => {
    expect(pageQuestions.length).toBeGreaterThanOrEqual(10);
    expect(overallQuestions.length).toBeGreaterThanOrEqual(7);
    expect(pageQuestions.map((question) => question.id)).toContain(
      "conversion",
    );
    expect(pageQuestions.map((question) => question.id)).toContain(
      "content_accuracy",
    );
    expect(overallQuestions.map((question) => question.id)).toContain(
      "must_change",
    );
  });

  it("normalizes safe review URLs and rejects unsafe protocols", () => {
    expect(normalizeReviewUrl("example.com/about#team")).toBe(
      "https://example.com/about",
    );
    expect(() => normalizeReviewUrl("javascript:alert(1)")).toThrow();
    expect(() =>
      normalizeReviewUrl("https://person:secret@example.com"),
    ).toThrow();
  });

  it("validates per-page scores and overall satisfaction", () => {
    expect(
      pageFeedbackSchema.safeParse({
        url: "https://example.com",
        pageTitle: "Home",
        pageScore: 5,
        answers: {},
        commentary: "",
      }).success,
    ).toBe(true);
    expect(
      pageFeedbackSchema.safeParse({
        url: "https://example.com",
        pageScore: 6,
        answers: {},
      }).success,
    ).toBe(false);
    expect(
      submitFeedbackSchema.safeParse({
        satisfactionScore: 10,
        approvalStatus: "approved",
        overallAnswers: {},
      }).success,
    ).toBe(true);
  });

  it("validates page-specific website markup", () => {
    expect(markupNoteSchema.safeParse({
      id: "mark-1",
      kind: "circle",
      category: "modify_text",
      x: 0.15,
      y: 0.2,
      width: 0.35,
      height: 0.12,
      text: "Replace this heading with the new copy.",
    }).success).toBe(true);
    expect(markupNoteSchema.safeParse({
      id: "mark-2",
      kind: "circle",
      category: "change_picture",
      x: 1.2,
      y: 0.2,
      width: 0.35,
      height: 0.12,
      text: "Use the team photo.",
    }).success).toBe(false);
  });

  it("keeps the CTA and editor handoff contracts", async () => {
    const [
      digital,
      structured,
      homepage,
      livePreviewPane,
      portalShell,
      previewReviewAction,
      sessionRoute,
      server,
      workspace,
      markupCanvas,
      markupMigration,
    ] = await Promise.all([
      readFile("app/(d2dmktg)/digital/page.tsx", "utf8"),
      readFile("components/site-manager/structured-entry-editor.tsx", "utf8"),
      readFile("components/site-manager/homepage-hero-editor.tsx", "utf8"),
      readFile("components/site-manager/live-preview-pane.tsx", "utf8"),
      readFile("components/site-manager/portal-shell.tsx", "utf8"),
      readFile("components/site-manager/preview-review-action.tsx", "utf8"),
      readFile("app/api/website-feedback/sessions/route.ts", "utf8"),
      readFile("lib/website-feedback-server.ts", "utf8"),
      readFile("components/website-feedback/feedback-workspace.tsx", "utf8"),
      readFile("components/website-feedback/markup-canvas.tsx", "utf8"),
      readFile("supabase/migrations/202609110001_website_feedback_markup.sql", "utf8"),
    ]);
    expect(digital).toContain("/digital/website-feedback");
    expect(structured).toContain("PreviewReviewAction");
    expect(homepage).toContain("PreviewReviewAction");
    expect(livePreviewPane).toContain('aria-label="Preview viewport"');
    expect(livePreviewPane).toContain('setViewport("desktop")');
    expect(livePreviewPane).toContain('setViewport("mobile")');
    expect(livePreviewPane).toContain("max-w-[390px]");
    expect(portalShell).toContain("Click here to review this page");
    expect(portalShell).toContain("portal-sidebar-review-pointer");
    expect(previewReviewAction).not.toContain("Click here to review this page");
    expect(previewReviewAction).toContain("Review this preview");
    expect(structured).toContain("encodeURIComponent(payload.url)");
    expect(sessionRoute).toContain(".middleware(verificationRequest, false)");
    expect(sessionRoute).toContain("verificationResponse.json()");
    expect(server).toContain("if (delivery.error)");
    expect(server).toContain("resend.batch.send");
    expect(server).toContain("Your website feedback copy");
    expect(workspace).toContain("Draft · save separately");
    expect(workspace).toContain(
      "event.source !== frameRef.current?.contentWindow",
    );
    expect(workspace).not.toContain("submit it to Jim");
    expect(markupCanvas).toContain("Circle an area");
    expect(markupCanvas).toContain("Modify text");
    expect(markupCanvas).toContain("Change picture");
    expect(markupMigration).toContain("annotations jsonb");
  });
});
