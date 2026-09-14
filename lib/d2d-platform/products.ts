import type { D2DProduct, ProductRole } from "@/lib/d2d-platform/types";

export type D2DProductDefinition = {
  value: D2DProduct;
  label: string;
  description: string;
  defaultLaunchUrl: string;
  defaultCustomerRole: ProductRole;
};

export const d2dProducts = [
  {
    value: "social",
    label: "D2D Social",
    description: "Marketing plans, promotions, social content, and approvals.",
    defaultLaunchUrl: "https://webadmin.d2dmktg.com/portal/marketing",
    defaultCustomerRole: "reviewer",
  },
  {
    value: "brand_vault",
    label: "Brand Vault",
    description: "Approved logos, photos, guidelines, and shared brand files.",
    defaultLaunchUrl: "https://brandvault.d2dmktg.com/auth/login",
    defaultCustomerRole: "viewer",
  },
  {
    value: "web_management",
    label: "Web Management",
    description: "Website content, previews, reviews, and publishing tools.",
    defaultLaunchUrl: "https://webadmin.d2dmktg.com/portal/dashboard",
    defaultCustomerRole: "viewer",
  },
] as const satisfies readonly D2DProductDefinition[];

export function getD2DProduct(product: D2DProduct) {
  return d2dProducts.find((item) => item.value === product)!;
}
