import { z } from "zod";

const imageSchema = z.object({
  sourceKind: z.enum(["legacy_local", "supabase_draft", "supabase_public"]),
  path: z.string().min(1).max(1000),
  altText: z.string().max(240),
  decorative: z.boolean(),
  caption: z.string().max(500).optional(),
}).superRefine((image, context) => {
  if (!image.decorative && image.altText.trim().length === 0) {
    context.addIssue({ code: "custom", path: ["altText"], message: "Describe meaningful images or mark them decorative." });
  }
});

const internalLinkSchema = z.string().regex(/^\/(?!\/)[a-zA-Z0-9/_#-]*$/, "Choose an approved internal path.");
const seoSchema = z.object({ title: z.string().max(80), description: z.string().max(200) });

export const globalSettingsSchema = z.object({
  businessName: z.string().min(1).max(120),
  phone: z.string().min(7).max(40),
  email: z.string().email(),
  serviceAreaSummary: z.string().min(1).max(300),
  defaultDescription: z.string().min(1).max(300),
  defaultSeoTitle: z.string().max(80),
  defaultSeoDescription: z.string().max(200),
  defaultSocialImage: imageSchema,
  footerContactCopy: z.string().max(600),
  consultationCtaLabel: z.string().min(1).max(60),
});

export const homepageHeroSchema = z.object({
  seo: seoSchema,
  eyebrow: z.string().min(1).max(60),
  heading: z.string().min(1).max(140),
  supportingCopy: z.string().min(1).max(500),
  image: imageSchema,
  primaryCta: z.object({ label: z.string().min(1).max(60), href: internalLinkSchema }),
  secondaryCta: z.object({ label: z.string().min(1).max(60), href: internalLinkSchema }),
  trustCues: z.array(z.string().min(1).max(60)).min(1).max(8),
});

export const serviceSchema = z.object({
  title: z.string().min(1).max(100), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().min(1).max(1000), order: z.number().int().min(0), visible: z.boolean(),
});
export const processStepSchema = z.object({ step: z.string().min(1).max(10), eyebrow: z.string().max(60).optional(), title: z.string().min(1).max(100), description: z.string().min(1).max(1000), image: imageSchema.optional(), order: z.number().int().min(0), visible: z.boolean() });
export const testimonialSchema = z.object({ quote: z.string().min(1).max(2000), name: z.string().min(1).max(120), context: z.string().max(200).optional(), featured: z.boolean(), order: z.number().int().min(0), visible: z.boolean() });
export const serviceAreaSchema = z.object({ title: z.string().min(1).max(100), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), shortDescription: z.string().min(1).max(400), body: z.string().max(10000), heroImage: imageSchema.optional(), seo: seoSchema, order: z.number().int().min(0), visible: z.boolean(), ctaLabel: z.string().max(60) });
export const portfolioProjectSchema = z.object({ title: z.string().min(1).max(140), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), category: z.string().max(100), location: z.string().max(160).optional(), description: z.string().min(1).max(3000), completionYear: z.number().int().min(1900).max(2200).optional(), coverImage: imageSchema, featured: z.boolean(), visible: z.boolean(), order: z.number().int().min(0), images: z.array(imageSchema.extend({ room: z.string().min(1).max(80), order: z.number().int().min(0), visible: z.boolean() })).max(500) });
export const journalPostSchema = z.object({ title: z.string().min(1).max(160), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), excerpt: z.string().min(1).max(500), body: z.array(z.object({ type: z.enum(["paragraph", "heading", "blockquote", "list"]), text: z.string().max(10000) })).max(300), coverImage: imageSchema.optional(), authorDisplayName: z.string().min(1).max(120), publishDate: z.string().date(), seo: seoSchema, visible: z.boolean() });
export const contactPageSchema = z.object({ seo: seoSchema, eyebrow: z.string().max(60), heading: z.string().min(1).max(160), introduction: z.string().min(1).max(1000), displayedPhone: z.string().min(7).max(40), displayedEmail: z.string().email(), serviceAreaCopy: z.string().max(1000), ctaText: z.string().max(120) });

export type GlobalSettings = z.infer<typeof globalSettingsSchema>;
export type HomepageHero = z.infer<typeof homepageHeroSchema>;
