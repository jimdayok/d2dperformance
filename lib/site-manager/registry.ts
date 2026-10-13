import { alfordSiteDefinition } from "@/lib/site-manager/sites/alford-custom-homes/definition";
import { acadiaSiteDefinition } from "@/lib/site-manager/sites/acadia-eye/definition";
import { phoenixSiteDefinition } from "@/lib/site-manager/sites/phoenix-builds/definition";
import type { SiteDefinition } from "@/lib/site-manager/types";

const d2dMarketingDefinition: SiteDefinition = {
  key: "d2d-marketing",
  name: "D2D Marketing",
  organizationSlug: "d2d-marketing",
  productionUrl: "https://d2dmktg.com",
  previewAudience: "d2d-marketing",
  navigation: [
    { label: "Overview", href: "/portal/sites/d2d-marketing" },
    { label: "Social content review", href: "/portal/marketing" },
    { label: "Activity", href: "/portal/sites/d2d-marketing/activity" },
  ],
  models: {},
  editorGroups: {},
  modelKeyForEntry: () => null,
  allowedPreviewPaths: [],
  allowedRevalidationTags: [],
};

const definitions: Record<string, SiteDefinition> = {
  [d2dMarketingDefinition.key]: d2dMarketingDefinition,
  [alfordSiteDefinition.key]: alfordSiteDefinition,
  [acadiaSiteDefinition.key]: acadiaSiteDefinition,
  [phoenixSiteDefinition.key]: phoenixSiteDefinition,
};

export function getSiteDefinition(siteSlug: string) { return definitions[siteSlug] ?? null; }
export function listSiteDefinitions() { return Object.values(definitions); }
