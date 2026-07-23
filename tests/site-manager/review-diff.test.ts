import { describe, expect, it } from "vitest";
import { createReviewDiff, formatReviewValue } from "@/lib/site-manager/review-diff";

describe("review diff", () => {
  it("returns only changed leaf fields with reviewer labels", () => {
    expect(createReviewDiff(
      { heading: "Old heading", seo: { title: "Same title" }, visible: true },
      { heading: "New heading", seo: { title: "Same title" }, visible: false },
      { heading: "Homepage heading", visible: "Visible on site" },
    )).toEqual([
      { path: "heading", label: "Homepage heading", before: "Old heading", after: "New heading" },
      { path: "visible", label: "Visible on site", before: true, after: false },
    ]);
  });

  it("treats all draft fields as additions for an initial publication", () => {
    expect(createReviewDiff(undefined, { title: "First post", tags: ["news", "design"] })).toEqual([
      { path: "tags", label: "Tags", before: undefined, after: ["news", "design"] },
      { path: "title", label: "Title", before: undefined, after: "First post" },
    ]);
  });

  it("formats reviewer values without exposing raw object coercion", () => {
    expect(formatReviewValue(true)).toBe("Yes");
    expect(formatReviewValue(undefined)).toBe("Not set");
    expect(formatReviewValue(["Dallas", "Highland Park"])).toBe("Dallas\nHighland Park");
  });
});
