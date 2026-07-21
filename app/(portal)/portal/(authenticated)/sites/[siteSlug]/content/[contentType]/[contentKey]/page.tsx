import { HomepageHeroEditor } from "@/components/site-manager/homepage-hero-editor";
import { StructuredEntryEditor } from "@/components/site-manager/structured-entry-editor";
import { requireSiteAccess } from "@/lib/site-manager/access";
import { canPublish } from "@/lib/site-manager/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { homepageHeroSchema } from "@/lib/site-manager/sites/alford-custom-homes/validation";
import { editorGroups, modelKeyForEntry } from "@/lib/site-manager/sites/alford-custom-homes/editor-config";
import { getSiteDefinition } from "@/lib/site-manager/registry";

export default async function ContentEntryPage({ params }: { params: Promise<{ siteSlug: string; contentType: string; contentKey: string }> }) {
  const { siteSlug, contentType, contentKey } = await params;
  const { site, access } = await requireSiteAccess(siteSlug);
  const supabase = await createSupabaseServerClient();
  const { data: entry } = await supabase.from("content_entries").select("id,title,draft_data,draft_revision,workflow_status,updated_at,published_at").eq("site_id", site.id).eq("content_type", contentType).eq("content_key", contentKey).is("deleted_at", null).maybeSingle();
  if (!entry) return <div><h1 className="font-display text-4xl font-semibold">Content not seeded</h1><p className="mt-4 max-w-2xl text-black/60">This structured editor is ready, but the matching Alford content record has not been added yet. Run the reviewed Alford export and seed before editing this area. The static website remains active.</p></div>;
  if (contentType === "page_section" && contentKey === "homepage-hero") {
    const validated = homepageHeroSchema.safeParse(entry.draft_data);
    if (!validated.success) return <div role="alert" className="rounded-xl bg-red-50 p-5 text-red-900">This draft does not match the current homepage hero schema. It was not opened for editing.</div>;
    return <div className="mx-auto max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a5f34]">Homepage</p><h1 className="mt-2 mb-8 font-display text-4xl font-semibold">Homepage hero</h1><HomepageHeroEditor entry={{ ...entry, draft_data: validated.data }} siteSlug={siteSlug} canPublish={canPublish(access)} /></div>;
  }
  const modelKey = modelKeyForEntry(contentType, contentKey);
  const model = modelKey ? getSiteDefinition(siteSlug)?.models[modelKey] : null;
  const groups = modelKey ? editorGroups[modelKey] : null;
  if (modelKey && model && groups) {
    const validated = model.schema.safeParse(entry.draft_data);
    if (!validated.success) return <div role="alert" className="rounded-xl bg-red-50 p-5 text-red-900">This draft does not match the current {model.label.toLowerCase()} schema. It was not opened for editing.</div>;
    return <div className="mx-auto max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a5f34]">{model.label}</p><h1 className="mt-2 mb-8 font-display text-4xl font-semibold">{entry.title}</h1><StructuredEntryEditor entry={{ ...entry, draft_data: validated.data as Record<string, unknown> }} siteSlug={siteSlug} modelKey={modelKey} groups={groups} canPublish={canPublish(access)} /></div>;
  }
  return <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a5f34]">{contentType.replaceAll("_", " ")}</p><h1 className="mt-2 font-display text-4xl font-semibold">{entry.title}</h1><p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">This content remains protected by tenant, workflow, and version history controls. Its specialized media editor is still being completed, so no raw JSON editor is exposed.</p></div>;
}
