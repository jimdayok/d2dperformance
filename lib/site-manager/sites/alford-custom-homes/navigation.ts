import type { SiteNavigationItem } from "@/lib/site-manager/types";

export const alfordNavigation: SiteNavigationItem[] = [
  { label: "Overview", href: "/portal/sites/alford-custom-homes" },
  { label: "Homepage", href: "/portal/sites/alford-custom-homes/content/page_section/homepage-hero", modelKey: "homepage-hero" },
  { label: "About", href: "/portal/sites/alford-custom-homes/content/page/about" },
  { label: "Services", href: "/portal/sites/alford-custom-homes/content/service" },
  { label: "Portfolio", href: "/portal/sites/alford-custom-homes/content/portfolio_project" },
  { label: "Testimonials", href: "/portal/sites/alford-custom-homes/content/testimonial" },
  { label: "Process", href: "/portal/sites/alford-custom-homes/content/process_step" },
  { label: "Service Areas", href: "/portal/sites/alford-custom-homes/content/service_area" },
  { label: "Journal", href: "/portal/sites/alford-custom-homes/content/journal_post" },
  { label: "Contact and Global Settings", href: "/portal/sites/alford-custom-homes/content/global_settings/global", modelKey: "global-settings" },
  { label: "Media Library", href: "/portal/sites/alford-custom-homes/media" },
  { label: "Review Queue", href: "/portal/sites/alford-custom-homes/review", requiredRole: "publisher" },
  { label: "Version History", href: "/portal/sites/alford-custom-homes/versions" },
  { label: "Users and Permissions", href: "/portal/sites/alford-custom-homes/users", requiredRole: "site_admin" },
  { label: "Activity", href: "/portal/sites/alford-custom-homes/activity" },
];
