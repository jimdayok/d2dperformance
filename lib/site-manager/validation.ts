import { getSiteDefinition } from "@/lib/site-manager/registry";

export function validateContent(siteSlug: string, modelKey: string, data: unknown) {
  const site = getSiteDefinition(siteSlug);
  if (!site) return { success: false as const, error: "Unknown site adapter." };
  const model = site.models[modelKey];
  if (!model) return { success: false as const, error: "Unknown content model." };
  const result = model.schema.safeParse(data);
  return result.success ? { success: true as const, data: result.data, model } : { success: false as const, error: result.error.flatten() };
}
