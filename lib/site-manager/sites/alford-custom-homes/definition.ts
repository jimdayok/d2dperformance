import type { SiteDefinition } from "@/lib/site-manager/types";
import { alfordContentModels } from "./content-models";
import { alfordNavigation } from "./navigation";
import { alfordAllowedPreviewPaths, alfordAllowedRevalidationTags } from "./preview-map";

export const alfordSiteDefinition: SiteDefinition = {
  key: "alford-custom-homes", name: "Alford Custom Builders", organizationSlug: "alford-custom-homes",
  productionUrl: "https://alfordcustombuilders.com", previewAudience: "alford-custom-homes",
  navigation: alfordNavigation, models: alfordContentModels,
  allowedPreviewPaths: alfordAllowedPreviewPaths,
  allowedRevalidationTags: alfordAllowedRevalidationTags,
};
