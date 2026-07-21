import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireSiteAccess } from "@/lib/site-manager/access";

export default async function SiteOverview({ params }: { params: Promise<{ siteSlug: string }> }) {
  const { siteSlug } = await params;
  const { site } = await requireSiteAccess(siteSlug);
  const supabase = await createSupabaseServerClient();
  const [{ count: drafts }, { count: review }, { data: recent }, { data: publish }] = await Promise.all([
    supabase.from("content_entries").select("id", { count: "exact", head: true }).eq("site_id", site.id).in("workflow_status", ["draft", "changes_requested"]),
    supabase.from("content_entries").select("id", { count: "exact", head: true }).eq("site_id", site.id).eq("workflow_status", "in_review"),
    supabase.from("content_entries").select("id,title,workflow_status,updated_at").eq("site_id", site.id).order("updated_at", { ascending: false }).limit(5),
    supabase.from("publish_events").select("status,created_at,completed_at").eq("site_id", site.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const cards = [["Drafts", String(drafts ?? 0)], ["Awaiting review", String(review ?? 0)], ["Publishing mode", site.publishing_mode.replaceAll("_", " ")], ["Last revalidation", publish?.status ?? "No publishes yet"]];
  return <div><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a5f34]">Overview</p><h1 className="mt-2 font-display text-4xl font-semibold">{site.name}</h1></div><a href={site.production_url} target="_blank" rel="noreferrer" className="rounded-lg border border-black/15 bg-white px-4 py-2 text-sm font-semibold">Open live site</a></div><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-2xl border border-black/10 bg-white p-5"><p className="text-xs uppercase tracking-wider text-black/45">{label}</p><p className="mt-3 text-2xl font-semibold capitalize">{value}</p></div>)}</div><section className="mt-8 rounded-2xl border border-black/10 bg-white p-6"><h2 className="font-display text-2xl font-semibold">Recent activity</h2><div className="mt-4 divide-y divide-black/8">{recent?.map((item) => <div key={item.id} className="flex justify-between gap-4 py-3 text-sm"><span>{item.title}</span><span className="capitalize text-black/50">{item.workflow_status.replaceAll("_", " ")}</span></div>)}{!recent?.length ? <p className="py-4 text-sm text-black/55">Seed Alford content to begin editing.</p> : null}</div></section></div>;
}
