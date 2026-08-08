import type { EditorGroup } from "@/lib/site-manager/editor-config";

const seoFields = [
  { path: "seo.title", label: "SEO title", maxLength: 80 },
  { path: "seo.description", label: "SEO description", kind: "textarea" as const, maxLength: 200 },
];

const heroFields = [
  { path: "eyebrow", label: "Eyebrow", maxLength: 100 },
  { path: "heading", label: "Heading", kind: "textarea" as const, maxLength: 160 },
  { path: "summary", label: "Supporting copy", kind: "textarea" as const, maxLength: 600 },
  { path: "primaryCtaLabel", label: "Primary button label", maxLength: 70 },
  { path: "secondaryCtaLabel", label: "Secondary button label", maxLength: 70 },
];

export const phoenixEditorGroups: Record<string, EditorGroup[]> = {
  gateway: [
    { title: "Commercial entry", fields: [
      { path: "commercialHeading", label: "Heading" },
      { path: "commercialSummary", label: "Summary", kind: "textarea" },
      { path: "commercialCtaLabel", label: "Button label" },
    ] },
    { title: "Residential entry", fields: [
      { path: "residentialHeading", label: "Heading" },
      { path: "residentialSummary", label: "Summary", kind: "textarea" },
      { path: "residentialCtaLabel", label: "Button label" },
    ] },
    { title: "Search preview", fields: seoFields },
  ],
  "commercial-hero": [{ title: "Commercial opening", fields: heroFields }, { title: "Search preview", fields: seoFields }],
  "residential-hero": [{ title: "Residential opening", fields: heroFields }, { title: "Search preview", fields: seoFields }],
};

export function phoenixModelKeyForEntry(contentType: string, contentKey: string) {
  if (contentType === "page_section" && ["gateway", "commercial-hero", "residential-hero"].includes(contentKey)) return contentKey;
  return null;
}
