import "server-only";
import { generatedSocialBatchSchema } from "@/lib/d2d-platform/schemas";
import type { GeneratedSocialBatch, MarketingPlanContent } from "@/lib/d2d-platform/types";

type PromotionContext = {
  name: string;
  description: string;
  offer_terms: string;
  starts_at: string;
  ends_at: string;
  channels: string[];
};

const socialBatchJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "rationale", "items"],
  properties: {
    title: { type: "string" },
    rationale: { type: "string" },
    items: {
      type: "array",
      minItems: 1,
      maxItems: 31,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "scheduledFor", "theme", "captions", "visualBrief", "requiredAssets"],
        properties: {
          day: { type: "integer", minimum: 1 },
          scheduledFor: { type: "string", format: "date-time" },
          theme: { type: "string" },
          captions: {
            type: "object",
            additionalProperties: false,
            required: ["facebook", "instagram", "linkedin"],
            properties: {
              facebook: { type: "string" },
              instagram: { type: "string" },
              linkedin: { type: "string" },
            },
          },
          visualBrief: { type: "string" },
          requiredAssets: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

function responseText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("output" in payload) || !Array.isArray(payload.output)) return null;
  for (const item of payload.output) {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (content && typeof content === "object" && "type" in content && content.type === "output_text"
        && "text" in content && typeof content.text === "string") return content.text;
    }
  }
  return null;
}
export async function generateSocialBatch(input: {
  organizationName: string;
  periodStart: string;
  periodEnd: string;
  plan: MarketingPlanContent;
  promotions: PromotionContext[];
  instructions: string;
}): Promise<GeneratedSocialBatch> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI drafting is not configured.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_SOCIAL_MODEL ?? "gpt-5-mini",
        store: false,
        instructions: [
          "You are the drafting assistant inside D2D Social.",
          "Create accurate, platform-specific draft content grounded only in the supplied approved marketing plan and promotions.",
          "Never invent a customer claim, testimonial, offer, location, event, logo, photograph, certification, staff member, or deadline.",
          "Treat all output as a draft requiring customer approval. Do not say that anything has been approved, scheduled, or published.",
          "Use the organization's timezone when choosing times and keep every scheduled time inside the requested period.",
        ].join(" "),
        input: JSON.stringify(input),
        text: {
          format: {
            type: "json_schema",
            name: "d2d_social_batch",
            strict: true,
            schema: socialBatchJsonSchema,
          },
        },
      }),
    });
    if (!response.ok) throw new Error(`OpenAI drafting failed (${response.status}).`);
    const payload: unknown = await response.json();
    const text = responseText(payload);
    if (!text) throw new Error("OpenAI returned no structured draft.");
    return generatedSocialBatchSchema.parse(JSON.parse(text));
  } finally {
    clearTimeout(timeout);
  }
}
