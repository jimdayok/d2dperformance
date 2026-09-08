export type D2DProduct = "social" | "brand_vault" | "web_management";
export type ProductRole = "manager" | "creator" | "reviewer" | "viewer";

export type ProductAccess = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  product: D2DProduct;
  role: ProductRole | "platform_admin";
  launchUrl: string;
};
export type MarketingPlanContent = {
  executiveSummary: string;
  goals: string[];
  audiences: string[];
  positioning: string;
  voice: string[];
  contentPillars: Array<{ name: string; purpose: string; frequency: string }>;
  channels: Array<{ platform: string; cadence: string; purpose: string }>;
  seasonalPriorities: string[];
  measures: string[];
  responsibilities: Array<{ owner: string; responsibility: string }>;
};

export type GeneratedSocialItem = {
  day: number;
  scheduledFor: string;
  theme: string;
  captions: {
    facebook: string;
    instagram: string;
    linkedin: string;
  };
  visualBrief: string;
  requiredAssets: string[];
};

export type GeneratedSocialBatch = {
  title: string;
  rationale: string;
  items: GeneratedSocialItem[];
};
