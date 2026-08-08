import { z } from "zod";

const seoSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(200),
});

const heroSchema = z.object({
  eyebrow: z.string().trim().min(1).max(100),
  heading: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(600),
  primaryCtaLabel: z.string().trim().min(1).max(70),
  secondaryCtaLabel: z.string().trim().min(1).max(70),
  seo: seoSchema,
});

export const phoenixGatewaySchema = z.object({
  commercialHeading: z.string().trim().min(1).max(120),
  commercialSummary: z.string().trim().min(1).max(400),
  commercialCtaLabel: z.string().trim().min(1).max(70),
  residentialHeading: z.string().trim().min(1).max(120),
  residentialSummary: z.string().trim().min(1).max(400),
  residentialCtaLabel: z.string().trim().min(1).max(70),
  seo: seoSchema,
});

export const phoenixCommercialHeroSchema = heroSchema;
export const phoenixResidentialHeroSchema = heroSchema;

export const phoenixGlobalSchema = z.object({
  name: z.string().trim().min(1).max(120),
  strapline: z.string().trim().min(1).max(120),
  purpose: z.string().trim().min(1).max(160),
  location: z.string().trim().min(1).max(160),
  serviceArea: z.string().trim().min(1).max(240),
  phone: z.string().trim().min(1).max(40),
  phoneHref: z.string().regex(/^tel:\+[0-9]{7,15}$/),
  email: z.string().email().max(200),
  ownerNarrative: z.string().trim().min(1).max(1200),
  commercialServices: z.array(z.string().trim().min(1).max(100)).min(1).max(10),
  residentialServices: z.array(z.string().trim().min(1).max(100)).min(1).max(10),
});

export const phoenixContactSchema = z.object({
  commercialIntro: z.string().trim().min(1).max(800),
  residentialIntro: z.string().trim().min(1).max(800),
  seo: seoSchema,
});
