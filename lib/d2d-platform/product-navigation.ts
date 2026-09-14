import type { ProductAccess } from "@/lib/d2d-platform/types";

type AccessibleSiteTarget = {
  site: {
    organization_id: string;
    slug: string;
  };
};

export function getProductLaunchHref(
  product: ProductAccess,
  sites: AccessibleSiteTarget[],
) {
  if (product.product === "social") return "/portal/marketing";
  if (product.product === "web_management") {
    const website = sites.find(({ site }) => site.organization_id === product.organizationId);
    if (website) return `/portal/sites/${encodeURIComponent(website.site.slug)}`;
  }
  return product.launchUrl;
}
