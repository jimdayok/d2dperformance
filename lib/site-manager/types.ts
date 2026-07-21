import type { ZodType } from "zod";

export const siteRoles = ["site_admin", "publisher", "editor", "viewer"] as const;
export type SiteRole = (typeof siteRoles)[number];

export type FieldType =
  | "short_text"
  | "long_text"
  | "number"
  | "toggle"
  | "select"
  | "internal_link"
  | "external_link"
  | "image"
  | "image_gallery"
  | "repeater"
  | "ordered_relation"
  | "slug"
  | "seo"
  | "restricted_rich_text";

export type EditorFieldDefinition = {
  key: string;
  label: string;
  type: FieldType;
  description?: string;
  required?: boolean;
  maxLength?: number;
};

export type EditorSectionDefinition = {
  key: string;
  label: string;
  description?: string;
  fields: EditorFieldDefinition[];
};

export type ContentModelDefinition<T> = {
  key: string;
  label: string;
  description: string;
  contentType: string;
  schema: ZodType<T>;
  sections: EditorSectionDefinition[];
  previewPath: (data: T) => string;
  cacheTags: (contentKey: string, data: T) => string[];
  requiredRole?: SiteRole;
};

export type SiteNavigationItem = {
  label: string;
  href: string;
  modelKey?: string;
  requiredRole?: SiteRole;
};

export type SiteDefinition = {
  key: string;
  name: string;
  organizationSlug: string;
  productionUrl: string;
  previewAudience: string;
  navigation: SiteNavigationItem[];
  models: Record<string, ContentModelDefinition<unknown>>;
  allowedPreviewPaths: readonly string[];
  allowedRevalidationTags: readonly string[];
};

export type UserAccess = {
  userId: string;
  isPlatformAdmin: boolean;
  role: SiteRole | null;
  siteId: string;
  organizationId: string;
  publishingMode: "approval_required" | "client_can_publish";
};
