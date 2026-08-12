import { z } from "zod";

const seoSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(200),
});

export const acadiaHeroSchema = z.object({
  eyebrow: z.string().trim().min(1).max(80),
  heading: z.string().trim().min(1).max(140),
  emphasis: z.string().trim().min(1).max(100),
  summary: z.string().trim().min(1).max(500),
  primaryCtaLabel: z.string().trim().min(1).max(60),
  secondaryCtaLabel: z.string().trim().min(1).max(60),
  detailItems: z.array(z.string().trim().min(1).max(80)).min(1).max(5),
  seo: seoSchema,
});

export const acadiaGlobalSchema = z.object({
  businessName: z.string().trim().min(1).max(120),
  location: z.string().trim().min(1).max(120),
  addressLines: z.array(z.string().trim().min(1).max(160)).min(1).max(3),
  phoneDisplay: z.string().trim().min(1).max(40),
  phoneHref: z.string().regex(/^tel:\+[0-9]{7,15}$/),
  appointmentHref: z.string().startsWith("/").max(200),
});

export const acadiaServicesPageSchema = z.object({
  eyebrow: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().min(1).max(500),
  seo: seoSchema,
});

export type AcadiaHero = z.infer<typeof acadiaHeroSchema>;
export type AcadiaGlobal = z.infer<typeof acadiaGlobalSchema>;
export type AcadiaServicesPage = z.infer<typeof acadiaServicesPageSchema>;
