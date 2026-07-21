import type { ContentModelDefinition } from "@/lib/site-manager/types";
import {
  contactPageSchema, globalSettingsSchema, homepageHeroSchema, journalPostSchema,
  portfolioProjectSchema, processStepSchema, serviceAreaSchema, serviceSchema, testimonialSchema,
  type GlobalSettings, type HomepageHero,
} from "@/lib/site-manager/sites/alford-custom-homes/validation";

const tags = (type: string) => (key: string) => [`site:alford-custom-homes`, `content:${type}`, `content:${type}:${key}`];

export const globalSettingsModel: ContentModelDefinition<GlobalSettings> = {
  key: "global-settings", label: "Contact and Global Settings", contentType: "global_settings",
  description: "Business identity, public contact details, defaults, and the global consultation call to action.",
  schema: globalSettingsSchema, previewPath: () => "/", cacheTags: tags("global_settings"),
  sections: [
    { key: "identity", label: "Business identity", fields: [
      { key: "businessName", label: "Business display name", type: "short_text", required: true, maxLength: 120 },
      { key: "phone", label: "Displayed phone", type: "short_text", required: true },
      { key: "email", label: "Displayed email", type: "short_text", required: true },
      { key: "serviceAreaSummary", label: "Service-area summary", type: "long_text", required: true, maxLength: 300 },
    ] },
    { key: "defaults", label: "SEO and footer defaults", fields: [
      { key: "defaultSeoTitle", label: "Default SEO title", type: "short_text", maxLength: 80 },
      { key: "defaultSeoDescription", label: "Default SEO description", type: "long_text", maxLength: 200 },
      { key: "defaultSocialImage", label: "Default sharing image", type: "image", required: true },
      { key: "footerContactCopy", label: "Footer contact copy", type: "long_text", maxLength: 600 },
    ] },
  ],
};

export const homepageHeroModel: ContentModelDefinition<HomepageHero> = {
  key: "homepage-hero", label: "Homepage Hero", contentType: "page_section",
  description: "The opening message and calls to action on the Alford homepage.",
  schema: homepageHeroSchema, previewPath: () => "/", cacheTags: tags("page_section"),
  sections: [
    { key: "copy", label: "Hero copy", description: "Appears over the opening home image.", fields: [
      { key: "eyebrow", label: "Eyebrow", type: "short_text", required: true, maxLength: 60 },
      { key: "heading", label: "Heading", type: "long_text", required: true, maxLength: 140 },
      { key: "supportingCopy", label: "Supporting copy", type: "long_text", required: true, maxLength: 500 },
      { key: "image", label: "Hero image", type: "image", required: true },
    ] },
    { key: "actions", label: "Calls to action", fields: [
      { key: "primaryCta", label: "Primary action", type: "internal_link", required: true },
      { key: "secondaryCta", label: "Secondary action", type: "internal_link", required: true },
      { key: "trustCues", label: "Trust cues", type: "repeater", required: true },
    ] },
    { key: "seo", label: "Search preview", fields: [{ key: "seo", label: "SEO title and description", type: "seo", required: true }] },
  ],
};

const simpleModels: Record<string, ContentModelDefinition<unknown>> = {
  service: { key: "service", label: "Service", description: "An independently versioned service.", contentType: "service", schema: serviceSchema, sections: [], previewPath: () => "/services", cacheTags: tags("service") },
  processStep: { key: "process-step", label: "Process Step", description: "An ordered visible process step.", contentType: "process_step", schema: processStepSchema, sections: [], previewPath: () => "/our-process", cacheTags: tags("process_step") },
  testimonial: { key: "testimonial", label: "Testimonial", description: "Approved customer quote and attribution.", contentType: "testimonial", schema: testimonialSchema, sections: [], previewPath: () => "/#testimonials", cacheTags: tags("testimonial") },
  serviceArea: { key: "service-area", label: "Service Area", description: "Location content and SEO.", contentType: "service_area", schema: serviceAreaSchema, sections: [], previewPath: (value) => `/service-areas#${(value as {slug:string}).slug}`, cacheTags: tags("service_area") },
  portfolioProject: { key: "portfolio-project", label: "Portfolio Project", description: "Project and room-filtered image gallery.", contentType: "portfolio_project", schema: portfolioProjectSchema, sections: [], previewPath: (value) => `/portfolio/${(value as {slug:string}).slug}`, cacheTags: tags("portfolio_project") },
  journalPost: { key: "journal-post", label: "Journal Post", description: "Restricted structured editorial content.", contentType: "journal_post", schema: journalPostSchema, sections: [], previewPath: (value) => `/journal/${(value as {slug:string}).slug}`, cacheTags: tags("journal_post") },
  contactPage: { key: "contact-page", label: "Contact Page", description: "Displayed contact copy; form behavior remains code controlled.", contentType: "page", schema: contactPageSchema, sections: [], previewPath: () => "/contact", cacheTags: tags("page") },
};

export const alfordContentModels: Record<string, ContentModelDefinition<unknown>> = {
  [globalSettingsModel.key]: globalSettingsModel as ContentModelDefinition<unknown>,
  [homepageHeroModel.key]: homepageHeroModel as ContentModelDefinition<unknown>,
  ...Object.fromEntries(Object.values(simpleModels).map((model) => [model.key, model])),
};
