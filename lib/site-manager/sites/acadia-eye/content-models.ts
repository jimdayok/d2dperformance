import type { ContentModelDefinition } from "@/lib/site-manager/types";
import {
  acadiaHeroSchema,
  acadiaServicesPageSchema,
} from "./validation";

const tags = (type: string) => (key: string) => [
  "site:acadia-eye",
  `content:${type}`,
  `content:${type}:${key}`,
];

export const acadiaContentModels: Record<string, ContentModelDefinition<unknown>> = {
  "homepage-hero": {
    key: "homepage-hero",
    label: "Homepage Hero",
    description: "Opening marketing message and approved calls to action.",
    contentType: "page_section",
    schema: acadiaHeroSchema,
    sections: [],
    previewPath: () => "/",
    cacheTags: tags("page_section"),
  },
  "services-page": {
    key: "services-page",
    label: "Services Page Introduction",
    description: "Introductory copy only. Clinical service claims remain code controlled.",
    contentType: "page",
    schema: acadiaServicesPageSchema,
    sections: [],
    previewPath: () => "/services",
    cacheTags: tags("page"),
  },
};
