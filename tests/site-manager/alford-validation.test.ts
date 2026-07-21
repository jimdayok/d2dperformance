import { describe, expect, it } from "vitest";
import { homepageHeroSchema } from "@/lib/site-manager/sites/alford-custom-homes/validation";

const valid = { seo: { title: "Title", description: "Description" }, eyebrow: "Builder", heading: "A well-made home", supportingCopy: "Supporting copy", image: { sourceKind: "legacy_local", path: "/image.jpg", altText: "Home exterior", decorative: false }, primaryCta: { label: "Contact", href: "/contact" }, secondaryCta: { label: "Work", href: "/portfolio" }, trustCues: ["Custom homes"] };

describe("Alford homepage hero schema", () => {
  it("accepts structured approved content", () => expect(homepageHeroSchema.safeParse(valid).success).toBe(true));
  it("rejects external CTA destinations", () => expect(homepageHeroSchema.safeParse({ ...valid, primaryCta: { label: "Bad", href: "https://example.com" } }).success).toBe(false));
  it("requires alt text for meaningful images", () => expect(homepageHeroSchema.safeParse({ ...valid, image: { ...valid.image, altText: "" } }).success).toBe(false));
  it("accepts an explicitly decorative image", () => expect(homepageHeroSchema.safeParse({ ...valid, image: { ...valid.image, altText: "", decorative: true } }).success).toBe(true));
});
