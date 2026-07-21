import { describe, expect, it } from "vitest";
import { aboutPageSchema, homepageHeroSchema, journalPostSchema, serviceAreaSchema } from "@/lib/site-manager/sites/alford-custom-homes/validation";
import { editorGroups, modelKeyForEntry } from "@/lib/site-manager/sites/alford-custom-homes/editor-config";
import { alfordSiteDefinition } from "@/lib/site-manager/sites/alford-custom-homes/definition";

const valid = { seo: { title: "Title", description: "Description" }, eyebrow: "Builder", heading: "A well-made home", supportingCopy: "Supporting copy", image: { sourceKind: "legacy_local", path: "/image.jpg", altText: "Home exterior", decorative: false }, primaryCta: { label: "Contact", href: "/contact" }, secondaryCta: { label: "Work", href: "/portfolio" }, trustCues: ["Custom homes"] };

describe("Alford homepage hero schema", () => {
  it("accepts structured approved content", () => expect(homepageHeroSchema.safeParse(valid).success).toBe(true));
  it("rejects external CTA destinations", () => expect(homepageHeroSchema.safeParse({ ...valid, primaryCta: { label: "Bad", href: "https://example.com" } }).success).toBe(false));
  it("requires alt text for meaningful images", () => expect(homepageHeroSchema.safeParse({ ...valid, image: { ...valid.image, altText: "" } }).success).toBe(false));
  it("accepts an explicitly decorative image", () => expect(homepageHeroSchema.safeParse({ ...valid, image: { ...valid.image, altText: "", decorative: true } }).success).toBe(true));
});

const validImage = { sourceKind: "legacy_local" as const, path: "/images/founder.jpg", altText: "Ben Alford in a completed home", decorative: false };

describe("Alford structured portal models", () => {
  it("uses the canonical customer name and live website", () => {
    expect(alfordSiteDefinition.name).toBe("Alford Custom Builders");
    expect(alfordSiteDefinition.productionUrl).toBe("https://alfordcustombuilders.com");
  });

  it("accepts editable About page content", () => {
    const result = aboutPageSchema.safeParse({
      seo: { title: "About Alford", description: "Meet the builder." }, eyebrow: "About", heading: "Built on trust.", introduction: "A personal building company.",
      founderEyebrow: "Founder", founderTitle: "Meet Ben", founderDescription: "Second-generation experience.", founderImage: validImage,
      differentiators: [{ title: "Direct access", description: "Work directly with the builder." }], legacyEyebrow: "Legacy", legacyTitle: "Doing the work well.",
      legacyParagraphs: ["A family building tradition."], valuesEyebrow: "Values", valuesTitle: "What matters", valuesDescription: "Quality and transparency.",
      brandPillars: [{ title: "Quality", description: "Disciplined execution." }], marketFocus: ["Highland Park"], ctaTitle: "Discuss your build", ctaDescription: "Start with a conversation.", primaryCtaLabel: "Contact", secondaryCtaLabel: "View work",
    });
    expect(result.success).toBe(true);
  });

  it("accepts editable Service Area location and full content", () => {
    expect(serviceAreaSchema.safeParse({ title: "Highland Park", slug: "highland-park", shortDescription: "Luxury building in Highland Park.", body: "Full neighborhood-specific content.", seo: { title: "Highland Park Builder", description: "Custom homes in Highland Park." }, order: 1, visible: true, ctaLabel: "Discuss Your Build" }).success).toBe(true);
  });

  it("accepts structured blog content but rejects raw HTML block types", () => {
    const base = { title: "Planning a Custom Home", slug: "planning-a-custom-home", excerpt: "What to consider before design begins.", body: [{ type: "paragraph", text: "Start with priorities." }], authorDisplayName: "Ben Alford", publishDate: "2026-07-21", seo: { title: "Planning a Custom Home", description: "A practical planning guide." }, visible: true };
    expect(journalPostSchema.safeParse(base).success).toBe(true);
    expect(journalPostSchema.safeParse({ ...base, body: [{ type: "html", text: "<script>alert(1)</script>" }] }).success).toBe(false);
  });

  it("routes seeded entries to the intended structured editor", () => {
    expect(modelKeyForEntry("page", "about")).toBe("about-page");
    expect(modelKeyForEntry("service_area", "highland-park")).toBe("service-area");
    expect(modelKeyForEntry("journal_post", "planning-a-custom-home")).toBe("journal-post");
    expect(modelKeyForEntry("global_settings", "global")).toBe("global-settings");
    expect(editorGroups["global-settings"].flatMap((group) => group.fields).some((field) => field.path === "email")).toBe(true);
  });
});
