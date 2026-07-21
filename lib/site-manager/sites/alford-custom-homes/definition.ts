import type { SiteDefinition } from "@/lib/site-manager/types";
import { alfordContentModels } from "./content-models";
import { alfordNavigation } from "./navigation";
import { alfordAllowedPreviewPaths, alfordAllowedRevalidationTags } from "./preview-map";

export const alfordSiteDefinition: SiteDefinition = {
  key: "alford-custom-homes", name: "Alford Custom Homes", organizationSlug: "alford-custom-homes",
  productionUrl: "https://www.alfordcustomhomes.com", previewAudience: "alford-custom-homes",
  navigation: alfordNavigation, models: alfordContentModels,
  allowedPreviewPaths: alfordAllowedPreviewPaths,
  allowedRevalidationTags: alfordAllowedRevalidationTags,
};
