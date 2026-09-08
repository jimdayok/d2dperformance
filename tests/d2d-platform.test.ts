import { describe, expect, it } from "vitest";
import {
  generatedSocialBatchSchema,
  manualSocialBatchSchema,
  marketingPlanContentSchema,
  reviseSocialItemSchema,
} from "@/lib/d2d-platform/schemas";

const plan = {
  executiveSummary: "Build consistent demand.",
  goals: ["Increase qualified inquiries"],
  audiences: ["Established local business owners"],
  positioning: "Hands-on marketing direction and execution.",
  voice: ["Clear", "Practical"],
  contentPillars: [{ name: "Proof", purpose: "Build trust", frequency: "Weekly" }],
  channels: [{ platform: "LinkedIn", cadence: "Twice weekly", purpose: "Professional credibility" }],
  seasonalPriorities: [],
  measures: ["Qualified inquiries"],
  responsibilities: [{ owner: "D2D", responsibility: "Draft content" }],
};

describe("D2D customer marketing schemas", () => {
  it("accepts a complete reviewable marketing plan", () => {
    expect(marketingPlanContentSchema.parse(plan)).toEqual(plan);
  });

  it("requires separate Facebook, Instagram, and LinkedIn captions", () => {
    const result = generatedSocialBatchSchema.safeParse({
      title: "Week one",
      rationale: "Use the approved plan.",
      items: [{
        day: 1,
        scheduledFor: "2026-09-09T15:00:00.000Z",
        theme: "Proof",
        captions: { facebook: "Facebook", instagram: "Instagram" },
        visualBrief: "Use an approved customer image.",
        requiredAssets: ["Transparent logo"],
      }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-HTTPS media before it can reach D2D Social", () => {
    const result = reviseSocialItemSchema.safeParse({
      itemId: "65000000-0000-0000-0000-000000000001",
      caption: "Approved caption",
      media: [{ url: "http://example.test/image.png" }],
      scheduledFor: "2026-09-09T15:00:00.000Z",
      creativeBrief: "Approved image",
    });
    expect(result.success).toBe(false);
  });

  it("allows a manual approval batch to target only connected company platforms", () => {
    const result = manualSocialBatchSchema.parse({
      organizationId: "65000000-0000-4000-8000-000000000001",
      marketingPlanId: "65000000-0000-4000-8000-000000000002",
      title: "Approval proof",
      scheduledFor: "2099-09-09T15:00:00.000Z",
      captions: { facebook: "Exact approved Facebook copy", instagram: "Exact approved Instagram copy" },
      media: [{ url: "https://assets.example.test/approved.png", altText: "Approved image" }],
    });
    expect(result.captions.linkedin).toBeUndefined();
  });

  it("rejects an empty manual approval batch", () => {
    const result = manualSocialBatchSchema.safeParse({
      organizationId: "65000000-0000-4000-8000-000000000001",
      marketingPlanId: "65000000-0000-4000-8000-000000000002",
      title: "Approval proof",
      scheduledFor: "2099-09-09T15:00:00.000Z",
      captions: {},
      media: [],
    });
    expect(result.success).toBe(false);
  });
});
