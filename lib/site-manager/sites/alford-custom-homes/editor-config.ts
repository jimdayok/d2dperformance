export type EditorField = {
  path: string;
  label: string;
  kind?: "text" | "textarea" | "number" | "date" | "checkbox" | "string_list" | "content_blocks" | "titled_copy_list";
  help?: string;
  maxLength?: number;
};

export type EditorGroup = { title: string; description?: string; fields: EditorField[] };

export const editorGroups: Record<string, EditorGroup[]> = {
  "global-settings": [
    { title: "Business and contact details", description: "Used throughout the public site, footer, and contact links.", fields: [
      { path: "businessName", label: "Business name" }, { path: "phone", label: "Phone" }, { path: "email", label: "Email address" },
      { path: "serviceAreaSummary", label: "Service-area summary", kind: "textarea", maxLength: 300 },
      { path: "footerContactCopy", label: "Footer contact copy", kind: "textarea", maxLength: 600 },
      { path: "consultationCtaLabel", label: "Consultation button label" },
    ] },
    { title: "Site and search defaults", fields: [
      { path: "defaultDescription", label: "Default site description", kind: "textarea", maxLength: 300 },
      { path: "defaultSeoTitle", label: "Default SEO title", maxLength: 80 },
      { path: "defaultSeoDescription", label: "Default SEO description", kind: "textarea", maxLength: 200 },
      { path: "defaultSocialImage.path", label: "Default social image path", help: "Use an existing approved image path." },
      { path: "defaultSocialImage.altText", label: "Default social image description", maxLength: 240 },
    ] },
  ],
  service: [{ title: "Service details", fields: [
    { path: "title", label: "Service name" }, { path: "slug", label: "URL slug", help: "Lowercase letters, numbers, and hyphens only." },
    { path: "description", label: "Description", kind: "textarea", maxLength: 1000 }, { path: "order", label: "Display order", kind: "number" },
    { path: "visible", label: "Visible on the public site", kind: "checkbox" },
  ] }],
  "process-step": [{ title: "Process step", fields: [
    { path: "step", label: "Step number" }, { path: "eyebrow", label: "Short label" }, { path: "title", label: "Title" },
    { path: "description", label: "Description", kind: "textarea", maxLength: 1000 }, { path: "order", label: "Display order", kind: "number" },
    { path: "visible", label: "Visible on the public site", kind: "checkbox" },
  ] }],
  testimonial: [{ title: "Testimonial", description: "Only publish customer identities and quotes that have been approved for public use.", fields: [
    { path: "quote", label: "Quote", kind: "textarea", maxLength: 2000 }, { path: "name", label: "Customer name" },
    { path: "context", label: "Project or location context" }, { path: "featured", label: "Featured testimonial", kind: "checkbox" },
    { path: "order", label: "Display order", kind: "number" }, { path: "visible", label: "Visible on the public site", kind: "checkbox" },
  ] }],
  "service-area": [
    { title: "Location and page content", fields: [
      { path: "title", label: "Location name" }, { path: "slug", label: "URL anchor", help: "Lowercase letters, numbers, and hyphens only." },
      { path: "shortDescription", label: "Card summary", kind: "textarea", maxLength: 400 },
      { path: "body", label: "Full location content", kind: "textarea", maxLength: 10000 },
      { path: "ctaLabel", label: "Call-to-action label" }, { path: "order", label: "Display order", kind: "number" },
      { path: "visible", label: "Visible on the public site", kind: "checkbox" },
    ] },
    { title: "Search preview", fields: [
      { path: "seo.title", label: "SEO title", maxLength: 80 }, { path: "seo.description", label: "SEO description", kind: "textarea", maxLength: 200 },
    ] },
  ],
  "journal-post": [
    { title: "Blog entry", fields: [
      { path: "title", label: "Headline" }, { path: "slug", label: "URL slug" }, { path: "excerpt", label: "Summary", kind: "textarea", maxLength: 500 },
      { path: "authorDisplayName", label: "Author" }, { path: "publishDate", label: "Publication date", kind: "date" },
      { path: "visible", label: "Visible when published", kind: "checkbox" },
      { path: "body", label: "Article sections", kind: "content_blocks", help: "Use headings, paragraphs, quotations, and lists. No raw HTML is accepted." },
    ] },
    { title: "Search preview", fields: [
      { path: "seo.title", label: "SEO title", maxLength: 80 }, { path: "seo.description", label: "SEO description", kind: "textarea", maxLength: 200 },
    ] },
  ],
  "contact-page": [
    { title: "Contact page introduction", fields: [
      { path: "eyebrow", label: "Eyebrow" }, { path: "heading", label: "Heading", kind: "textarea" },
      { path: "introduction", label: "Introduction", kind: "textarea" }, { path: "serviceAreaCopy", label: "Service-area copy", kind: "textarea" },
      { path: "ctaText", label: "Contact call to action" },
    ] },
    { title: "Displayed contact details", fields: [
      { path: "displayedPhone", label: "Phone" }, { path: "displayedEmail", label: "Email address" },
      { path: "seo.title", label: "SEO title", maxLength: 80 }, { path: "seo.description", label: "SEO description", kind: "textarea", maxLength: 200 },
    ] },
  ],
  "about-page": [
    { title: "About page opening", fields: [
      { path: "eyebrow", label: "Eyebrow" }, { path: "heading", label: "Heading", kind: "textarea" },
      { path: "introduction", label: "Introduction", kind: "textarea" }, { path: "seo.title", label: "SEO title", maxLength: 80 },
      { path: "seo.description", label: "SEO description", kind: "textarea", maxLength: 200 },
    ] },
    { title: "Founder story", fields: [
      { path: "founderEyebrow", label: "Section label" }, { path: "founderTitle", label: "Founder story title", kind: "textarea" },
      { path: "founderDescription", label: "Founder story", kind: "textarea" }, { path: "founderImage.path", label: "Founder image path" },
      { path: "founderImage.altText", label: "Founder image description" }, { path: "differentiators", label: "Differentiators", kind: "titled_copy_list" },
    ] },
    { title: "Legacy and values", fields: [
      { path: "legacyEyebrow", label: "Legacy section label" }, { path: "legacyTitle", label: "Legacy title", kind: "textarea" },
      { path: "legacyParagraphs", label: "Legacy paragraphs", kind: "string_list" }, { path: "valuesEyebrow", label: "Values section label" },
      { path: "valuesTitle", label: "Values title", kind: "textarea" }, { path: "valuesDescription", label: "Values introduction", kind: "textarea" },
      { path: "brandPillars", label: "Brand pillars", kind: "titled_copy_list" }, { path: "marketFocus", label: "Market focus locations", kind: "string_list" },
    ] },
    { title: "Closing call to action", fields: [
      { path: "ctaTitle", label: "CTA title", kind: "textarea" }, { path: "ctaDescription", label: "CTA description", kind: "textarea" },
      { path: "primaryCtaLabel", label: "Primary button label" }, { path: "secondaryCtaLabel", label: "Secondary button label" },
    ] },
  ],
};

export function modelKeyForEntry(contentType: string, contentKey: string) {
  if (contentType === "page_section" && contentKey === "homepage-hero") return "homepage-hero";
  if (contentType === "global_settings") return "global-settings";
  if (contentType === "process_step") return "process-step";
  if (contentType === "service_area") return "service-area";
  if (contentType === "portfolio_project") return "portfolio-project";
  if (contentType === "journal_post") return "journal-post";
  if (contentType === "page" && contentKey === "about") return "about-page";
  if (contentType === "page" && contentKey === "contact") return "contact-page";
  if (["service", "testimonial"].includes(contentType)) return contentType;
  return null;
}
