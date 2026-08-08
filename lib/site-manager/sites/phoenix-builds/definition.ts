import type { SiteDefinition, SiteNavigationItem } from "@/lib/site-manager/types";
import { phoenixContentModels } from "./content-models";
import { phoenixEditorGroups, phoenixModelKeyForEntry } from "./editor-config";

const navigation: SiteNavigationItem[] = [
  { label: "Overview", href: "/portal/sites/phoenix-builds" },
  { label: "Gateway", href: "/portal/sites/phoenix-builds/content/page_section/gateway", modelKey: "gateway" },
  { label: "Commercial Homepage", href: "/portal/sites/phoenix-builds/content/page_section/commercial-hero", modelKey: "commercial-hero" },
  { label: "Residential Homepage", href: "/portal/sites/phoenix-builds/content/page_section/residential-hero", modelKey: "residential-hero" },
  { label: "Review Queue", href: "/portal/sites/phoenix-builds/review", requiredRole: "publisher" },
  { label: "Version History", href: "/portal/sites/phoenix-builds/versions" },
  { label: "Users and Permissions", href: "/portal/sites/phoenix-builds/users", requiredRole: "site_admin" },
  { label: "Activity", href: "/portal/sites/phoenix-builds/activity" },
];

export const phoenixSiteDefinition: SiteDefinition = {
  key: "phoenix-builds",
  name: "Phoenix Builds",
  organizationSlug: "phoenix-builds",
  productionUrl: "https://phoenix-builds.com",
  previewAudience: "phoenix-builds",
  navigation,
  models: phoenixContentModels,
  editorGroups: phoenixEditorGroups,
  modelKeyForEntry: phoenixModelKeyForEntry,
  allowedPreviewPaths: ["/", "/commercial", "/residential"],
  allowedRevalidationTags: ["site:phoenix-builds", "content:page_section"],
};
