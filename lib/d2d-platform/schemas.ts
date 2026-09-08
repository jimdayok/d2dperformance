import { z } from "zod";

export const productRoleSchema = z.enum(["manager", "creator", "reviewer", "viewer"]);

export const promotionSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().trim().min(1).max(180),
  description: z.string().trim().min(1).max(5000),
  offerTerms: z.string().trim().max(5000).default(""),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  channels: z.array(z.enum(["facebook", "instagram", "linkedin"])).min(1),
}).refine((value) => Date.parse(value.endsAt) >= Date.parse(value.startsAt), {
  message: "The end must be after the start.",
  path: ["endsAt"],
});

const nonEmptyList = z.array(z.string().trim().min(1).max(500)).min(1).max(20);

export const marketingPlanContentSchema = z.object({
  executiveSummary: z.string().trim().min(1).max(5000),
  goals: nonEmptyList,
  audiences: nonEmptyList,
  positioning: z.string().trim().min(1).max(3000),
  voice: nonEmptyList,
  contentPillars: z.array(z.object({
    name: z.string().trim().min(1).max(160),
    purpose: z.string().trim().min(1).max(1000),
    frequency: z.string().trim().min(1).max(160),
  })).min(1).max(12),
  channels: z.array(z.object({
    platform: z.string().trim().min(1).max(80),
    cadence: z.string().trim().min(1).max(160),
    purpose: z.string().trim().min(1).max(1000),
  })).min(1).max(12),
  seasonalPriorities: z.array(z.string().trim().min(1).max(500)).max(30),
  measures: nonEmptyList,
  responsibilities: z.array(z.object({
    owner: z.string().trim().min(1).max(160),
    responsibility: z.string().trim().min(1).max(1000),
  })).min(1).max(20),
});

export const marketingPlanDraftSchema = z.object({
  organizationId: z.string().uuid(),
  title: z.string().trim().min(1).max(180),
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
  summary: z.string().trim().max(3000).default(""),
  plan: marketingPlanContentSchema,
}).refine((value) => value.periodEnd >= value.periodStart, {
  message: "The plan end date must not precede its start date.",
  path: ["periodEnd"],
});

export const reviewSchema = z.object({
  subjectId: z.string().uuid(),
  decision: z.enum(["approved", "changes_requested"]),
  note: z.string().trim().max(5000).default(""),
});

export const reviseSocialItemSchema = z.object({
  itemId: z.string().uuid(),
  caption: z.string().trim().min(1).max(10000),
  media: z.array(z.object({
    url: z.string().url().refine((value) => value.startsWith("https://"), "Image URLs must use HTTPS."),
    altText: z.string().trim().max(500).optional(),
  })).max(10),
  scheduledFor: z.string().datetime(),
  creativeBrief: z.string().trim().max(3000),
});

export const generateSocialBatchSchema = z.object({
  organizationId: z.string().uuid(),
  marketingPlanId: z.string().uuid(),
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
  instructions: z.string().trim().max(5000).default(""),
}).refine((value) => value.periodEnd >= value.periodStart, {
  message: "The batch end date must not precede its start date.",
  path: ["periodEnd"],
});

export const generatedSocialBatchSchema = z.object({
  title: z.string().trim().min(1).max(180),
  rationale: z.string().trim().min(1).max(3000),
  items: z.array(z.object({
    day: z.number().int().positive(),
    scheduledFor: z.string().datetime(),
    theme: z.string().trim().min(1).max(240),
    captions: z.object({
      facebook: z.string().trim().min(1).max(10000),
      instagram: z.string().trim().min(1).max(10000),
      linkedin: z.string().trim().min(1).max(10000),
    }),
    visualBrief: z.string().trim().min(1).max(3000),
    requiredAssets: z.array(z.string().trim().min(1).max(500)).max(20),
  })).min(1).max(31),
});

export type PromotionInput = z.infer<typeof promotionSchema>;
export type MarketingPlanDraftInput = z.infer<typeof marketingPlanDraftSchema>;
export type GenerateSocialBatchInput = z.infer<typeof generateSocialBatchSchema>;
