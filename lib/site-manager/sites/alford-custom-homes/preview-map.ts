export const alfordAllowedPreviewPaths = ["/", "/about", "/services", "/our-process", "/service-areas", "/portfolio", "/journal", "/contact"] as const;
export const alfordAllowedRevalidationTags = ["site:alford-custom-homes", "content:global_settings", "content:page", "content:page_section", "content:service", "content:process_step", "content:testimonial", "content:service_area", "content:portfolio_project", "content:journal_post"] as const;

export function isAllowedAlfordPath(path: string) {
  return alfordAllowedPreviewPaths.includes(path as (typeof alfordAllowedPreviewPaths)[number])
    || /^\/portfolio\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path)
    || /^\/journal\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path);
}
