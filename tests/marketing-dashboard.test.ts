import { describe, expect, it } from "vitest";
import { buildMarketingCalendar, buildMarketingOverview, centralDateKey } from "@/lib/d2d-platform/marketing-dashboard";

const batches = [
  { id: "batch-review", title: "October review", status: "client_review" },
  { id: "batch-scheduled", title: "October scheduled", status: "scheduled" },
];

const items = [
  { id: "review-facebook", batch_id: "batch-review", platform: "facebook", scheduled_for: "2026-10-05T15:00:00.000Z", media: [], shoutrrr_post_id: null },
  { id: "review-instagram", batch_id: "batch-review", platform: "instagram", scheduled_for: "2026-10-05T15:00:00.000Z", media: [{ url: "https://assets.example/review.png" }], shoutrrr_post_id: null },
  { id: "scheduled-facebook", batch_id: "batch-scheduled", platform: "facebook", scheduled_for: "2026-10-06T15:00:00.000Z", media: [{ url: "https://assets.example/scheduled.png" }], shoutrrr_post_id: "post-1" },
];

describe("D2D Social client dashboard", () => {
  it("prioritizes exact content approvals in the client action card", () => {
    const overview = buildMarketingOverview({
      plans: [{ id: "plan", title: "2026 plan", status: "approved" }],
      promotions: [{ id: "promo", name: "Open house", starts_at: "2026-10-01T12:00:00.000Z", ends_at: "2026-10-10T12:00:00.000Z", status: "active", priority: "high" }],
      batches,
      items,
      now: new Date("2026-10-01T12:00:00.000Z"),
    });

    expect(overview).toMatchObject({
      approvalsWaiting: 1,
      scheduledPosts: 1,
      activeUpdates: 1,
      deliveryRecords: 1,
      missingCreative: 1,
      nextAction: { title: "Review 2 social posts", href: "#content" },
    });
  });

  it("combines scheduled posts and business updates in one calendar", () => {
    const events = buildMarketingCalendar({
      batches,
      items,
      promotions: [{ id: "promo", name: "Open house", starts_at: "2026-10-04T12:00:00.000Z", ends_at: "2026-10-10T12:00:00.000Z", status: "active", priority: "high" }],
    });

    expect(events.map((event) => [event.kind, event.dateKey])).toEqual([
      ["promotion", "2026-10-04"],
      ["post", "2026-10-05"],
      ["post", "2026-10-05"],
      ["post", "2026-10-06"],
    ]);
  });

  it("uses Central time for client-facing calendar dates", () => {
    expect(centralDateKey("2026-11-02T01:00:00.000Z")).toBe("2026-11-01");
  });
});
