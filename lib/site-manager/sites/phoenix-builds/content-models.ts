import type { ContentModelDefinition } from "@/lib/site-manager/types";
import {
  phoenixCommercialHeroSchema,
  phoenixGatewaySchema,
  phoenixResidentialHeroSchema,
} from "./validation";

const tags = (type: string) => (key: string) => [
  "site:phoenix-builds",
  `content:${type}`,
  `content:${type}:${key}`,
];

export const phoenixContentModels: Record<string, ContentModelDefinition<unknown>> = {
  gateway: { key: "gateway", label: "Gateway", description: "Commercial and residential entry choices.", contentType: "page_section", schema: phoenixGatewaySchema, sections: [], previewPath: () => "/", cacheTags: tags("page_section") },
  "commercial-hero": { key: "commercial-hero", label: "Commercial Hero", description: "Commercial homepage opening message.", contentType: "page_section", schema: phoenixCommercialHeroSchema, sections: [], previewPath: () => "/commercial", cacheTags: tags("page_section") },
  "residential-hero": { key: "residential-hero", label: "Residential Hero", description: "Residential homepage opening message.", contentType: "page_section", schema: phoenixResidentialHeroSchema, sections: [], previewPath: () => "/residential", cacheTags: tags("page_section") },
};
