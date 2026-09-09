import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { d2dProducts } from "@/lib/d2d-platform/products";
import {
  generatedSocialBatchSchema,
  marketingPlanContentSchema,
  reviseSocialItemSchema,
} from "@/lib/d2d-platform/schemas";

const plan = {
  executiveSummary: "Build consistent demand.",
  goals: ["Increase qualified inquiries"],
  audiences: ["Established local business owners"],
  positioning: "Hands-on marketing direction and execution.",
  voice: ["Clear", "Practical"],
  contentPillars: [{ name: "Proof", purpose: "Build trust", frequency: "Weekly" }],
  channels: [{ platform: "LinkedIn", cadence: "Twice weekly", purpose: "Professional credibility" }],
  seasonalPriorities: [],
  measures: ["Qualified inquiries"],
  responsibilities: [{ owner: "D2D", responsibility: "Draft content" }],
};

describe("D2D customer marketing schemas", () => {
  it("defines one secure launch destination and customer default for every service", () => {
    expect(d2dProducts.map((product) => product.value)).toEqual([
      "social",
      "brand_vault",
      "web_management",
    ]);
    expect(d2dProducts.every((product) => product.defaultLaunchUrl.startsWith("https://"))).toBe(true);
  });

  it("adds audited administrator-only customer access removal", () => {
    const migration = readFileSync(
      "supabase/migrations/202609090001_customer_product_access_controls.sql",
      "utf8",
    );
    expect(migration).toContain("admin_remove_product_member");
    expect(migration).toContain("public.is_platform_admin(auth.uid())");
    expect(migration).toContain("product_member.removed");
    expect(migration).toContain("person must belong to the organization");
    expect(migration).toContain("grant execute on function public.admin_remove_product_member");
  });

  it("makes the central Website Management button an actual route authorization gate", () => {
    const access = readFileSync("lib/site-manager/access.ts", "utf8");
    const migration = readFileSync(
      "supabase/migrations/202609090001_customer_product_access_controls.sql",
      "utf8",
    );
    expect(access).toContain('.eq("product", "web_management")');
    expect(access).toContain('entitlement.organization_id');
    expect(access).toContain('entitledOrganizationIds.has(organizationId)');
    expect(migration).toContain("Preserve every existing Website Management customer's current access");
    expect(migration).toContain("on conflict (organization_id, user_id, product) do nothing");
    expect(migration).toContain("direct requests cannot bypass the portal buttons");
    expect(migration).toContain("create or replace function public.has_site_role");
    expect(migration).toContain("create or replace function public.can_publish_site");
  });

  it("accepts a complete reviewable marketing plan", () => {
    expect(marketingPlanContentSchema.parse(plan)).toEqual(plan);
  });

  it("requires separate Facebook, Instagram, and LinkedIn captions", () => {
    const result = generatedSocialBatchSchema.safeParse({
      title: "Week one",
      rationale: "Use the approved plan.",
      items: [{
        day: 1,
        scheduledFor: "2026-09-09T15:00:00.000Z",
        theme: "Proof",
        captions: { facebook: "Facebook", instagram: "Instagram" },
        visualBrief: "Use an approved customer image.",
        requiredAssets: ["Transparent logo"],
      }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-HTTPS media before it can reach D2D Social", () => {
    const result = reviseSocialItemSchema.safeParse({
      itemId: "65000000-0000-0000-0000-000000000001",
      caption: "Approved caption",
      media: [{ url: "http://example.test/image.png" }],
      scheduledFor: "2026-09-09T15:00:00.000Z",
      creativeBrief: "Approved image",
    });
    expect(result.success).toBe(false);
  });
});
