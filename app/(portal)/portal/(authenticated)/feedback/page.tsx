import { notFound } from "next/navigation";
import { PortalShell } from "@/components/site-manager/portal-shell";
import { getAccessibleSites, getCurrentUser } from "@/lib/site-manager/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type FeedbackPage = { id: string; url: string; page_title: string; page_score: number; answers: Record<string, string>; commentary: string; updated_at: string };
type FeedbackSession = { id: string; client_name: string; client_email: string; company: string; status: string; satisfaction_score: number | null; approval_status: string | null; overall_answers: Record<string, string>; submitted_at: string | null; updated_at: string; website_feedback_pages: FeedbackPage[] };

function label(value: string) { return value.replaceAll("_", " "); }

export default async function FeedbackRepositoryPage() {
  const [sites, user] = await Promise.all([getAccessibleSites(), getCurrentUser()]);
  const access = sites.find((item) => item.access.isPlatformAdmin)?.access ?? null;
  if (!access?.isPlatformAdmin) notFound();
  let sessions: FeedbackSession[] = [];
  let loadError = "";
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("website_feedback_sessions").select("id,client_name,client_email,company,status,satisfaction_score,approval_status,overall_answers,submitted_at,updated_at,website_feedback_pages(id,url,page_title,page_score,answers,commentary,updated_at)").order("updated_at", { ascending: false }).limit(100);
    if (error) throw error;
    sessions = (data ?? []) as FeedbackSession[];
  } catch (error) {
    console.error("Feedback repository load failed.", error);
    loadError = "The feedback repository is not available until the website-feedback database migration is applied.";
  }
  return <PortalShell definition={null} access={access} displayName={user?.user_metadata?.display_name ?? user?.email ?? "Account"} siteCount={sites.length}><div><header className="border-b border-[#241c17]/12 pb-7"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9a5f34]">D2D Digital · Client collaboration</p><h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Feedback repository</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6258]">Saved page-by-page reviews, overall satisfaction, approval status, and the client&apos;s requested changes.</p></header>{loadError ? <p role="alert" className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">{loadError}</p> : null}<div className="mt-8 grid gap-5">{sessions.map((session) => <article key={session.id} className="portal-panel overflow-hidden"><header className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 p-6"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#9a5f34]">{session.status} · {session.website_feedback_pages.length} saved {session.website_feedback_pages.length === 1 ? "page" : "pages"}</p><h2 className="mt-2 font-display text-3xl font-semibold">{session.company}</h2><p className="mt-2 text-sm text-black/60">{session.client_name} · <a className="underline" href={`mailto:${session.client_email}`}>{session.client_email}</a></p></div><div className="text-right"><p className="font-display text-3xl font-semibold">{session.satisfaction_score ? `${session.satisfaction_score}/10` : "Draft"}</p><p className="text-xs capitalize text-black/50">{session.approval_status ? label(session.approval_status) : "Not submitted"}</p></div></header><details><summary className="cursor-pointer px-6 py-4 text-sm font-semibold">Open complete review</summary><div className="grid gap-6 border-t border-black/10 p-6"><section><h3 className="font-display text-2xl font-semibold">Overall review</h3><dl className="mt-4 grid gap-4 md:grid-cols-2">{Object.entries(session.overall_answers ?? {}).map(([key, value]) => <div key={key}><dt className="text-xs font-semibold capitalize text-[#9a5f34]">{label(key)}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-black/65">{value || "Not provided"}</dd></div>)}</dl></section>{session.website_feedback_pages.map((page, index) => <section key={page.id} className="rounded-xl border border-black/10 bg-white p-5"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#9a5f34]">Page {index + 1} · {page.page_score}/5</p><h3 className="mt-2 font-display text-2xl font-semibold">{page.page_title || page.url}</h3><a href={page.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-xs underline">{page.url}</a><dl className="mt-5 grid gap-4 md:grid-cols-2">{Object.entries(page.answers ?? {}).map(([key, value]) => <div key={key}><dt className="text-xs font-semibold capitalize text-[#9a5f34]">{label(key)}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-black/65">{value || "Not provided"}</dd></div>)}</dl>{page.commentary ? <div className="mt-5 border-t border-black/10 pt-4"><p className="text-xs font-semibold">Additional commentary</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-black/65">{page.commentary}</p></div> : null}</section>)}</div></details></article>)}{!sessions.length && !loadError ? <p className="portal-panel p-6 text-sm text-black/60">No client feedback sessions have been started yet.</p> : null}</div></div></PortalShell>;
}
