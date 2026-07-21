import Link from "next/link";
import { requireSiteAccess } from "@/lib/site-manager/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const contentTypeLabels: Record<string, string> = {
  global_settings: "Contact and Global Settings",
  journal_post: "Blog Entries",
  page: "Pages",
  page_section: "Page Sections",
  portfolio_project: "Portfolio Projects",
  process_step: "Process Steps",
  service: "Services",
  service_area: "Service Areas",
  testimonial: "Testimonials",
};

export default async function ContentList({ params }: { params: Promise<{ siteSlug: string; contentType: string }> }) {
  const { siteSlug, contentType } = await params; const { site } = await requireSiteAccess(siteSlug);
  const { data } = await (await createSupabaseServerClient()).from("content_entries").select("id,title,content_key,workflow_status,updated_at").eq("site_id", site.id).eq("content_type", contentType).is("deleted_at", null).order("title");
  const label = contentTypeLabels[contentType] ?? contentType.replaceAll("_", " ");
  return <div><h1 className="font-display text-4xl font-semibold">{label}</h1><div className="mt-8 divide-y divide-black/8 rounded-2xl border border-black/10 bg-white">{data?.map((entry) => <Link key={entry.id} href={`/portal/sites/${siteSlug}/content/${contentType}/${entry.content_key}`} className="flex items-center justify-between gap-4 p-5 hover:bg-black/[0.02]"><span className="font-medium">{entry.title}</span><span className="text-sm capitalize text-black/50">{entry.workflow_status.replaceAll("_", " ")}</span></Link>)}{!data?.length ? <p className="p-5 text-sm text-black/55">The editor is ready, but this content has not been seeded yet. The current public site remains unchanged.</p> : null}</div></div>;
}
