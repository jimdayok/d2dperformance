import type { SiteDefinition, SiteNavigationItem } from "@/lib/site-manager/types";
import { acadiaContentModels } from "./content-models";
import { acadiaEditorGroups, acadiaModelKeyForEntry } from "./editor-config";

const navigation: SiteNavigationItem[] = [
  { label: "Overview", href: "/portal/sites/acadia-eye" },
  { label: "Homepage", href: "/portal/sites/acadia-eye/content/page_section/homepage-hero", modelKey: "homepage-hero" },
  { label: "Services Introduction", href: "/portal/sites/acadia-eye/content/page/services", modelKey: "services-page" },
  { label: "Review Queue", href: "/portal/sites/acadia-eye/review", requiredRole: "publisher" },
  { label: "Version History", href: "/portal/sites/acadia-eye/versions" },
  { label: "Users and Permissions", href: "/portal/sites/acadia-eye/users", requiredRole: "site_admin" },
  { label: "Activity", href: "/portal/sites/acadia-eye/activity" },
];

export const acadiaSiteDefinition: SiteDefinition = {
  key: "acadia-eye",
  name: "Acadia Eye Center",
  organizationSlug: "acadia-eye",
  productionUrl: "https://www.acadiaeye.com",
  previewAudience: "acadia-eye",
  navigation,
  models: acadiaContentModels,
  editorGroups: acadiaEditorGroups,
  modelKeyForEntry: acadiaModelKeyForEntry,
  allowedPreviewPaths: ["/", "/services"],
  allowedRevalidationTags: ["site:acadia-eye", "content:page", "content:page_section"],
};
