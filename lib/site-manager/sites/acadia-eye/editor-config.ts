import type { EditorGroup } from "@/lib/site-manager/editor-config";

export const acadiaEditorGroups: Record<string, EditorGroup[]> = {
  "homepage-hero": [
    { title: "Opening message", description: "Visible on the Acadia Eye homepage.", fields: [
      { path: "eyebrow", label: "Eyebrow", maxLength: 80 },
      { path: "heading", label: "Main heading", kind: "textarea", maxLength: 140 },
      { path: "emphasis", label: "Emphasized heading line", maxLength: 100 },
      { path: "summary", label: "Supporting copy", kind: "textarea", maxLength: 500 },
      { path: "primaryCtaLabel", label: "Appointment button label", maxLength: 60 },
      { path: "secondaryCtaLabel", label: "Doctors link label", maxLength: 60 },
      { path: "detailItems", label: "Hero service cues", kind: "string_list", help: "Marketing labels only; clinical descriptions remain protected." },
    ] },
    { title: "Search preview", fields: [
      { path: "seo.title", label: "SEO title", maxLength: 80 },
      { path: "seo.description", label: "SEO description", kind: "textarea", maxLength: 200 },
    ] },
  ],
  "services-page": [
    { title: "Services introduction", description: "This does not change individual medical service guidance.", fields: [
      { path: "eyebrow", label: "Eyebrow" },
      { path: "title", label: "Page heading", kind: "textarea", maxLength: 140 },
      { path: "description", label: "Introduction", kind: "textarea", maxLength: 500 },
    ] },
    { title: "Search preview", fields: [
      { path: "seo.title", label: "SEO title", maxLength: 80 },
      { path: "seo.description", label: "SEO description", kind: "textarea", maxLength: 200 },
    ] },
  ],
};

export function acadiaModelKeyForEntry(contentType: string, contentKey: string) {
  if (contentType === "page_section" && contentKey === "homepage-hero") return "homepage-hero";
  if (contentType === "page" && contentKey === "services") return "services-page";
  return null;
}
