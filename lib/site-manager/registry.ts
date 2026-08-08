import { alfordSiteDefinition } from "@/lib/site-manager/sites/alford-custom-homes/definition";
import { acadiaSiteDefinition } from "@/lib/site-manager/sites/acadia-eye/definition";
import { phoenixSiteDefinition } from "@/lib/site-manager/sites/phoenix-builds/definition";
import type { SiteDefinition } from "@/lib/site-manager/types";

const definitions: Record<string, SiteDefinition> = {
  [alfordSiteDefinition.key]: alfordSiteDefinition,
  [acadiaSiteDefinition.key]: acadiaSiteDefinition,
  [phoenixSiteDefinition.key]: phoenixSiteDefinition,
};

export function getSiteDefinition(siteSlug: string) { return definitions[siteSlug] ?? null; }
export function listSiteDefinitions() { return Object.values(definitions); }
