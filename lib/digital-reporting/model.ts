import { z } from "zod";

export const metricDefinitions = [
  [
    "organic_clicks",
    "SEO",
    "Organic search clicks",
    "clicks",
    "Google Search Console",
  ],
  [
    "search_impressions",
    "SEO",
    "Search impressions",
    "impressions",
    "Google Search Console",
  ],
  [
    "search_ctr",
    "SEO",
    "Search click-through rate",
    "%",
    "Google Search Console",
  ],
  [
    "search_position",
    "SEO",
    "Average search position",
    "position",
    "Google Search Console",
  ],
  [
    "ai_mentions",
    "AI visibility",
    "Prompts mentioning the business",
    "%",
    "Documented prompt panel",
  ],
  [
    "ai_citations",
    "AI visibility",
    "Prompts citing the website",
    "%",
    "Documented prompt panel",
  ],
  ["users", "Website utilization", "Website users", "users", "GA4"],
  ["sessions", "Website utilization", "Website sessions", "sessions", "GA4"],
  ["engagement_rate", "Website utilization", "Engagement rate", "%", "GA4"],
  ["views", "Website utilization", "Page views", "views", "GA4"],
  [
    "leads",
    "Leads",
    "Verified qualified leads",
    "leads",
    "CRM / reconciled lead records",
  ],
  ["forms", "Leads", "Completed lead forms", "forms", "GA4 / form provider"],
  ["calls", "Leads", "Tracked phone calls", "calls", "Call tracking provider"],
  ["bookings", "Leads", "Completed bookings", "bookings", "Booking provider"],
  [
    "conversion_rate",
    "Leads",
    "Session lead conversion rate",
    "%",
    "Reconciled leads / GA4 sessions",
  ],
  [
    "lcp",
    "Technical health",
    "Largest Contentful Paint",
    "seconds",
    "CrUX field data",
  ],
  [
    "inp",
    "Technical health",
    "Interaction to Next Paint",
    "ms",
    "CrUX field data",
  ],
  [
    "cls",
    "Technical health",
    "Cumulative Layout Shift",
    "score",
    "CrUX field data",
  ],
  [
    "indexable_pages",
    "Technical health",
    "Indexable pages",
    "pages",
    "Documented technical crawl",
  ],
] as const;
const metricSchema = z
  .object({
    key: z.enum(metricDefinitions.map((d) => d[0]) as [string, ...string[]]),
    value: z.number().finite().nonnegative().nullable(),
    source: z.string().trim().min(1).max(500),
    evidence: z.string().trim().max(2000),
    measuredAt: z.string().datetime().nullable(),
    status: z.enum(["verified", "missing", "not_applicable"]),
    reason: z.string().trim().max(1000),
    method: z.string().trim().min(1).max(1000),
  })
  .superRefine((m, ctx) => {
    if (
      m.status === "verified" &&
      (m.value === null || !m.evidence || !m.measuredAt)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Verified metrics require a value, evidence reference, and collection timestamp.",
      });
    if (m.status !== "verified" && (m.value !== null || !m.reason))
      ctx.addIssue({
        code: "custom",
        message: "Unavailable metrics need a reason and no numeric value.",
      });
    if (
      m.value !== null &&
      [
        "search_ctr",
        "ai_mentions",
        "ai_citations",
        "engagement_rate",
        "conversion_rate",
      ].includes(m.key) &&
      m.value > 100
    )
      ctx.addIssue({
        code: "custom",
        message: "Percentage values must be between 0 and 100.",
      });
  });
export type Metric = z.infer<typeof metricSchema>;
export const contentSchema = z
  .object({
    summary: z.string().trim().min(1).max(4000),
    workCompleted: z.string().trim().max(6000),
    nextSteps: z.string().trim().max(6000),
    limitations: z.string().trim().min(1).max(6000),
    metrics: z.array(metricSchema).length(metricDefinitions.length),
  })
  .superRefine((c, ctx) => {
    if (new Set(c.metrics.map((m) => m.key)).size !== metricDefinitions.length)
      ctx.addIssue({
        code: "custom",
        message: "Include each reporting metric exactly once.",
      });
  });
export type ReportContent = z.infer<typeof contentSchema>;
export const enrollmentSchema = z
  .object({
    organizationId: z.string().uuid(),
    enabled: z.boolean(),
    monthly: z.boolean(),
    recipients: z
      .array(z.string().trim().email())
      .min(1)
      .max(10)
      .transform((v) => [...new Set(v.map((s) => s.toLowerCase()))]),
    auditPricing: z.enum(["complimentary", "paid"]),
    auditFee: z.number().finite().nonnegative().max(1000000),
    startMonth: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-01$/),
    proposalReference: z.string().trim().max(500),
  })
  .refine((e) => e.auditPricing !== "paid" || e.auditFee > 0, {
    message: "Paid audits require a positive agreed fee.",
  })
  .refine((e) => e.auditPricing !== "complimentary" || e.auditFee === 0, {
    message: "Complimentary audits have no fee.",
  });
export type EnrollmentInput = z.infer<typeof enrollmentSchema>;
export type Snapshot = ReportContent & {
  organizationName: string;
  organizationId: string;
  kind: "audit" | "monthly";
  period: string;
  createdAt: string;
  recipients: string[];
  pricing: string;
  baseline: {
    reportId: string;
    version: number;
    period: string;
    metrics: Metric[];
  } | null;
  previous: {
    reportId: string;
    version: number;
    period: string;
    metrics: Metric[];
  } | null;
  proposalReference: string;
};
export function emptyContent(): ReportContent {
  return {
    summary:
      "Review the available evidence and describe this customer's performance.",
    workCompleted: "",
    nextSteps: "",
    limitations:
      "Analytics, search, AI prompt-panel and lead tracking connections have not been verified for this report. No values have been estimated.",
    metrics: metricDefinitions.map(([key, , , , source]) => ({
      key,
      value: null,
      source,
      evidence: "",
      measuredAt: null,
      status: "missing",
      reason: "No verified data supplied for this period.",
      method: "Not connected",
    })),
  };
}
export function comparison(current: Metric, reference?: Metric): string {
  if (
    current.status !== "verified" ||
    !reference ||
    reference.status !== "verified" ||
    current.value === null ||
    reference.value === null
  )
    return "Unavailable";
  if (
    current.method !== reference.method ||
    current.source !== reference.source
  )
    return "Not comparable: source or method changed";
  if (reference.value === 0)
    return current.value === 0 ? "No change" : "From zero; % change undefined";
  const value = ((current.value - reference.value) / reference.value) * 100;
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}
export function previousMonth(period: string) {
  const [year, month] = period.split("-").map(Number);
  return `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, "0")}-01`;
}
