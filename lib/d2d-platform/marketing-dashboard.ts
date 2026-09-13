export type DashboardPlan = {
  id: string;
  title: string;
  status: string;
};

export type DashboardPromotion = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  priority: string;
};

export type DashboardBatch = {
  id: string;
  title: string;
  status: string;
};

export type DashboardItem = {
  id: string;
  batch_id: string;
  platform: string;
  scheduled_for: string;
  media: Array<{ url: string; altText?: string }>;
  shoutrrr_post_id: string | null;
};

export type MarketingOverview = {
  approvalsWaiting: number;
  scheduledPosts: number;
  activeUpdates: number;
  deliveryRecords: number;
  missingCreative: number;
  nextAction: {
    title: string;
    detail: string;
    href: string;
  };
};

export type MarketingCalendarEvent = {
  id: string;
  dateKey: string;
  label: string;
  kind: "post" | "promotion";
  status: string;
  platform?: string;
};

const terminalBatchStatuses = new Set(["published", "archived"]);
const scheduledBatchStatuses = new Set(["approved", "scheduling", "scheduled", "published"]);

export function centralDateKey(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function buildMarketingOverview({
  plans,
  promotions,
  batches,
  items,
  now = new Date(),
}: {
  plans: DashboardPlan[];
  promotions: DashboardPromotion[];
  batches: DashboardBatch[];
  items: DashboardItem[];
  now?: Date;
}): MarketingOverview {
  const batchById = new Map(batches.map((batch) => [batch.id, batch]));
  const nowTime = now.getTime();
  const reviewPlans = plans.filter((plan) => plan.status === "in_review");
  const reviewBatches = batches.filter((batch) => batch.status === "client_review");
  const activeUpdates = promotions.filter((promotion) => (
    promotion.status !== "cancelled" && Date.parse(promotion.ends_at) >= nowTime
  ));
  const scheduledPosts = items.filter((item) => {
    const batch = batchById.get(item.batch_id);
    return batch && scheduledBatchStatuses.has(batch.status) && Date.parse(item.scheduled_for) >= nowTime;
  });
  const missingCreative = items.filter((item) => {
    const batch = batchById.get(item.batch_id);
    return item.media.length === 0 && batch && !terminalBatchStatuses.has(batch.status);
  });

  let nextAction: MarketingOverview["nextAction"] = {
    title: "Everything is moving",
    detail: "There are no customer approvals waiting right now.",
    href: "#calendar",
  };
  if (reviewBatches.length > 0) {
    const postCount = items.filter((item) => reviewBatches.some((batch) => batch.id === item.batch_id)).length;
    nextAction = {
      title: `Review ${postCount} social post${postCount === 1 ? "" : "s"}`,
      detail: `${reviewBatches.length} content batch${reviewBatches.length === 1 ? " is" : "es are"} waiting for approval.`,
      href: "#content",
    };
  } else if (reviewPlans.length > 0) {
    nextAction = {
      title: "Review the marketing plan",
      detail: `${reviewPlans[0].title} is waiting for a decision.`,
      href: "#plan",
    };
  } else if (missingCreative.length > 0) {
    nextAction = {
      title: "Creative is being completed",
      detail: `${missingCreative.length} post${missingCreative.length === 1 ? " needs" : "s need"} approved imagery before customer review.`,
      href: "#content",
    };
  }

  return {
    approvalsWaiting: reviewPlans.length + reviewBatches.length,
    scheduledPosts: scheduledPosts.length,
    activeUpdates: activeUpdates.length,
    deliveryRecords: items.filter((item) => Boolean(item.shoutrrr_post_id)).length,
    missingCreative: missingCreative.length,
    nextAction,
  };
}

export function buildMarketingCalendar({
  promotions,
  batches,
  items,
}: {
  promotions: DashboardPromotion[];
  batches: DashboardBatch[];
  items: DashboardItem[];
}): MarketingCalendarEvent[] {
  const batchById = new Map(batches.map((batch) => [batch.id, batch]));
  const postEvents = items.flatMap((item) => {
    const batch = batchById.get(item.batch_id);
    if (!batch || batch.status === "archived") return [];
    return [{
      id: item.id,
      dateKey: centralDateKey(item.scheduled_for),
      label: batch.title,
      kind: "post" as const,
      status: batch.status,
      platform: item.platform,
    }];
  });
  const promotionEvents = promotions.flatMap((promotion) => {
    if (promotion.status === "cancelled") return [];
    return [{
      id: promotion.id,
      dateKey: promotion.starts_at.slice(0, 10),
      label: promotion.name,
      kind: "promotion" as const,
      status: promotion.status,
    }];
  });
  return [...postEvents, ...promotionEvents].sort((left, right) => (
    left.dateKey.localeCompare(right.dateKey) || left.label.localeCompare(right.label)
  ));
}
