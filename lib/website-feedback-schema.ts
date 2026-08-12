import { z } from "zod";

export const pageQuestions = [
  { id: "first_impression", label: "What is your first impression of this page?", prompt: "What feels strong, confusing, unexpected, or off-brand?" },
  { id: "message_clarity", label: "Is the main message immediately clear?", prompt: "Tell us what you think this page is trying to communicate." },
  { id: "audience_fit", label: "Does this speak to the right customer?", prompt: "Note language, services, priorities, or customer needs that should change." },
  { id: "content_accuracy", label: "Is the content accurate and complete?", prompt: "Flag incorrect details, missing information, claims, names, pricing, or terminology." },
  { id: "brand_voice", label: "Does it sound and feel like your business?", prompt: "Comment on tone, personality, colors, typography, imagery, and overall character." },
  { id: "visual_hierarchy", label: "Is the page easy to scan and understand?", prompt: "Call out sections that feel crowded, too sparse, out of order, or hard to notice." },
  { id: "imagery", label: "Do the images and visual elements feel right?", prompt: "Identify anything to replace, add, remove, crop differently, or explain more clearly." },
  { id: "conversion", label: "Is the next step clear and persuasive?", prompt: "Review buttons, forms, calls to action, contact paths, and what you want visitors to do." },
  { id: "trust", label: "What would make this page more credible?", prompt: "Consider proof, testimonials, credentials, project examples, FAQs, policies, or reassurance." },
  { id: "specific_changes", label: "What specific changes should we make on this page?", prompt: "List exact edits and mark anything that is essential before the next review." },
] as const;

export const overallQuestions = [
  { id: "overall_strengths", label: "What is working best across the site?" },
  { id: "overall_concerns", label: "What still feels unresolved or needs the most attention?" },
  { id: "missing_pages", label: "Are any pages, sections, features, or customer questions missing?" },
  { id: "customer_journey", label: "Can visitors find what they need and know what to do next?" },
  { id: "competitive_position", label: "Does this site distinguish the business from competitors?" },
  { id: "must_change", label: "What must change before you would approve this iteration?" },
  { id: "nice_to_have", label: "What would be helpful but is not required for this iteration?" },
] as const;

const answerSchema = z.record(z.string().max(80), z.string().max(5_000));

export const startFeedbackSchema = z.object({
  clientName: z.string().trim().min(2).max(120),
  clientEmail: z.string().trim().email().max(240),
  company: z.string().trim().min(2).max(180),
  initialUrl: z.string().trim().max(2_048),
  altcha: z.string().min(1).max(24_000),
  sourceSiteSlug: z.string().trim().max(120).optional().nullable(),
});

export const pageFeedbackSchema = z.object({
  url: z.string().trim().max(2_048),
  pageTitle: z.string().trim().max(240).optional().default(""),
  answers: answerSchema,
  pageScore: z.number().int().min(1).max(5),
  commentary: z.string().trim().max(10_000).optional().default(""),
});

export const submitFeedbackSchema = z.object({
  satisfactionScore: z.number().int().min(1).max(10),
  approvalStatus: z.enum(["needs_revision", "nearly_ready", "approved"]),
  overallAnswers: answerSchema,
});

export type PageFeedbackInput = z.infer<typeof pageFeedbackSchema>;
export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;

export function normalizeReviewUrl(value: string) {
  const candidate = value.trim();
  if (!candidate) return "";
  const withProtocol = /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`;
  const parsed = new URL(withProtocol);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error("Use a valid http or https website address.");
  if (parsed.username || parsed.password) throw new Error("Website addresses containing credentials are not supported.");
  parsed.hash = "";
  return parsed.toString();
}
