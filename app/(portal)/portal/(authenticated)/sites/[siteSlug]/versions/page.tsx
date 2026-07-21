import { RestoreVersionButton } from "@/components/site-manager/restore-version-button";
import { requireSiteAccess } from "@/lib/site-manager/access";
import { canPublish } from "@/lib/site-manager/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function VersionsPage({ params }: { params: Promise<{ siteSlug: string }> }) {
  const { siteSlug } = await params; const { site, access } = await requireSiteAccess(siteSlug); const supabase = await createSupabaseServerClient();
  const { data: entries } = await supabase.from("content_entries").select("id,title,draft_revision").eq("site_id", site.id);
  const ids = entries?.map((entry) => entry.id) ?? [];
  const { data: versions } = ids.length ? await supabase.from("content_versions").select("id,content_entry_id,revision,action,created_at,created_by").in("content_entry_id", ids).order("created_at", { ascending: false }).limit(100) : { data: [] };
  const entryMap = new Map(entries?.map((entry) => [entry.id, entry]));
  return <div><h1 className="font-display text-4xl font-semibold">Version History</h1><p className="mt-2 text-black/55">Restores create a new draft and never change the live site directly.</p><div className="mt-8 divide-y divide-black/8 rounded-2xl border border-black/10 bg-white">{versions?.map((version) => { const entry = entryMap.get(version.content_entry_id); return <div key={version.id} className="grid gap-2 p-5 sm:grid-cols-[1fr_auto_auto_auto] sm:items-start"><span>{entry?.title}</span><span className="text-sm">Revision {version.revision} · <span className="capitalize">{version.action.replaceAll("_", " ")}</span></span><time className="text-sm text-black/45">{new Date(version.created_at).toLocaleString()}</time>{canPublish(access) && entry ? <RestoreVersionButton siteSlug={siteSlug} entryId={entry.id} versionId={version.id} expectedRevision={entry.draft_revision} /> : null}</div>; })}{!versions?.length ? <p className="p-5 text-sm text-black/55">No versions recorded.</p> : null}</div></div>;
}
