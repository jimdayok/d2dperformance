import { alfordSiteDefinition } from "@/lib/site-manager/sites/alford-custom-homes/definition";
import type { SiteDefinition } from "@/lib/site-manager/types";

const definitions: Record<string, SiteDefinition> = { [alfordSiteDefinition.key]: alfordSiteDefinition };

export function getSiteDefinition(siteSlug: string) { return definitions[siteSlug] ?? null; }
export function listSiteDefinitions() { return Object.values(definitions); }
