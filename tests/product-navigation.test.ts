import { describe, expect, it } from "vitest";
import { getProductLaunchHref } from "@/lib/d2d-platform/product-navigation";
import type { ProductAccess } from "@/lib/d2d-platform/types";

const acadiaWebAccess: ProductAccess = {
  organizationId: "acadia-organization-id",
  organizationName: "Acadia Eye Center",
  organizationSlug: "acadia-eye-center",
  product: "web_management",
  role: "platform_admin",
  launchUrl: "https://webadmin.d2dmktg.com/portal/dashboard",
};

describe("D2D product navigation", () => {
  it("opens the website editor matched to the product's organization", () => {
    expect(getProductLaunchHref(acadiaWebAccess, [
      { site: { organization_id: "another-organization-id", slug: "another-site" } },
      { site: { organization_id: "acadia-organization-id", slug: "acadia-eye" } },
    ])).toBe("/portal/sites/acadia-eye");
  });

  it("does not borrow another customer's website editor", () => {
    expect(getProductLaunchHref(acadiaWebAccess, [
      { site: { organization_id: "another-organization-id", slug: "another-site" } },
    ])).toBe("https://webadmin.d2dmktg.com/portal/dashboard");
  });

  it("keeps social navigation inside the D2D Account", () => {
    expect(getProductLaunchHref({
      ...acadiaWebAccess,
      product: "social",
      launchUrl: "https://social.d2dperformance.com",
    }, [])).toBe("/portal/marketing");
  });
});
