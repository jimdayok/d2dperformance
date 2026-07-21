import Link from "next/link";
import { RequestChanges } from "@/components/site-manager/request-changes";
import { requireSiteAccess } from "@/lib/site-manager/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ReviewQueue({ params }: { params: Promise<{ siteSlug: string }> }) {
  const { siteSlug } = await params; const { site } = await requireSiteAccess(siteSlug);
  const { data } = await (await createSupabaseServerClient()).from("content_entries").select("id,title,content_type,content_key,draft_revision,updated_at").eq("site_id", site.id).eq("workflow_status", "in_review").order("updated_at");
  return <div><h1 className="font-display text-4xl font-semibold">Review Queue</h1><div className="mt-8 divide-y divide-black/8 rounded-2xl border border-black/10 bg-white">{data?.map((entry) => <div key={entry.id} className="p-5"><Link href={`/portal/sites/${siteSlug}/content/${entry.content_type}/${entry.content_key}`} className="flex justify-between"><span className="font-medium underline underline-offset-4">{entry.title}</span><span className="text-sm text-black/50">Revision {entry.draft_revision}</span></Link><RequestChanges siteSlug={siteSlug} entryId={entry.id}/></div>)}{!data?.length ? <p className="p-5 text-sm text-black/55">Nothing is awaiting review.</p> : null}</div></div>;
}
