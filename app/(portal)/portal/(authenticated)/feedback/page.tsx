import { notFound } from "next/navigation";
import { PortalShell } from "@/components/site-manager/portal-shell";
import { getAccessibleSites, getCurrentUser } from "@/lib/site-manager/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MarkupNote } from "@/lib/website-feedback-schema";

type FeedbackPage = {
  id: string;
  url: string;
  page_title: string;
  page_score: number;
  answers: Record<string, string>;
  ratings: Record<string, number>;
  annotations: MarkupNote[];
  commentary: string;
  updated_at: string;
};

type FeedbackSession = {
  id: string;
  client_name: string;
  client_email: string;
  company: string;
  status: string;
  satisfaction_score: number | null;
  approval_status: string | null;
  overall_answers: Record<string, string>;
  submitted_at: string | null;
  updated_at: string;
  website_feedback_pages: FeedbackPage[];
};

const markupLabels: Record<MarkupNote["category"], string> = {
  modify_text: "Modify text",
  change_picture: "Change picture",
  general: "General note",
};

function label(value: string) {
  return value.replaceAll("_", " ");
}

function MarkupReview({ page }: { page: FeedbackPage }) {
  if (!page.annotations?.length) return null;
  return (
    <div className="mt-5 border-t border-black/10 pt-5">
      <div className="flex items-baseline justify-between gap-4">
        <h4 className="text-sm font-semibold">Website markup</h4>
        <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#9a5f34]">{page.annotations.length} {page.annotations.length === 1 ? "mark" : "marks"}</span>
      </div>
      <details className="mt-3 overflow-hidden rounded-lg border border-black/10 bg-[#ecefea]">
        <summary className="cursor-pointer px-4 py-3 text-xs font-semibold">Show marks on the webpage</summary>
        <div className="relative aspect-[2/1] min-h-80 overflow-hidden border-t border-black/10 bg-white">
          <iframe className="h-full w-full border-0" src={page.url} title={`Marked review of ${page.page_title || page.url}`} sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts" />
          <div className="pointer-events-none absolute inset-0">
            {page.annotations.map((annotation, index) => (
              <div key={annotation.id}>
                {annotation.kind === "circle" ? <span className="absolute rounded-[50%] border-[3px] border-[#e14a36] bg-[#7ee8ee]/10" style={{ left: `${annotation.x * 100}%`, top: `${annotation.y * 100}%`, width: `${Math.max(annotation.width, .02) * 100}%`, height: `${Math.max(annotation.height, .02) * 100}%` }} /> : null}
                <span className="absolute grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#e14a36] text-xs font-bold text-white shadow-lg" style={{ left: `${(annotation.x + annotation.width) * 100}%`, top: `${annotation.y * 100}%` }}>{index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </details>
      <ol className="mt-3 grid gap-2">
        {page.annotations.map((annotation, index) => <li key={annotation.id} className="rounded-lg bg-[#edf4f1] p-3 text-sm"><strong className="text-[#0c7379]">{index + 1}. {markupLabels[annotation.category]}</strong><p className="mt-1 whitespace-pre-wrap leading-6 text-black/65">{annotation.text || "Area marked without an additional note."}</p></li>)}
      </ol>
    </div>
  );
}

export default async function FeedbackRepositoryPage() {
  const [sites, user] = await Promise.all([getAccessibleSites(), getCurrentUser()]);
  const access = sites.find((item) => item.access.isPlatformAdmin)?.access ?? null;
  if (!access?.isPlatformAdmin) notFound();

  let sessions: FeedbackSession[] = [];
  let loadError = "";
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("website_feedback_sessions")
      .select("id,client_name,client_email,company,status,satisfaction_score,approval_status,overall_answers,submitted_at,updated_at,website_feedback_pages(id,url,page_title,page_score,answers,ratings,annotations,commentary,updated_at)")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    sessions = (data ?? []) as FeedbackSession[];
  } catch (error) {
    console.error("Feedback repository load failed.", error);
    loadError = "The feedback repository is not available until the website-feedback database migration is applied.";
  }

  return (
    <PortalShell definition={null} access={access} displayName={user?.user_metadata?.display_name ?? user?.email ?? "Account"} siteCount={sites.length}>
      <div>
        <header className="border-b border-[#241c17]/12 pb-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9a5f34]">D2D Digital · Client collaboration</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Feedback repository</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6258]">Page-by-page website markup, general notes, optional survey responses, and completed review status.</p>
        </header>
        {loadError ? <p role="alert" className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">{loadError}</p> : null}
        <div className="mt-8 grid gap-5">
          {sessions.map((session) => (
            <article key={session.id} className="portal-panel overflow-hidden">
              <header className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 p-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#9a5f34]">{session.status} · {session.website_feedback_pages.length} saved {session.website_feedback_pages.length === 1 ? "page" : "pages"}</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold">{session.company}</h2>
                  <p className="mt-2 text-sm text-black/60">{session.client_name} · <a className="underline" href={`mailto:${session.client_email}`}>{session.client_email}</a></p>
                </div>
                <div className="text-right"><p className="font-display text-3xl font-semibold">{session.satisfaction_score ? `${session.satisfaction_score}/10` : "Draft"}</p><p className="text-xs capitalize text-black/50">{session.approval_status ? label(session.approval_status) : "Not submitted"}</p></div>
              </header>
              <details>
                <summary className="cursor-pointer px-6 py-4 text-sm font-semibold">Open complete review</summary>
                <div className="grid gap-6 border-t border-black/10 p-6">
                  <section>
                    <h3 className="font-display text-2xl font-semibold">Overall review</h3>
                    <dl className="mt-4 grid gap-4 md:grid-cols-2">{Object.entries(session.overall_answers ?? {}).map(([key, value]) => <div key={key}><dt className="text-xs font-semibold capitalize text-[#9a5f34]">{label(key)}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-black/65">{value || "Not provided"}</dd></div>)}</dl>
                  </section>
                  {session.website_feedback_pages.map((page, index) => (
                    <section key={page.id} className="rounded-xl border border-black/10 bg-white p-5">
                      <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#9a5f34]">Page {index + 1} · {page.page_score}/5</p>
                      <h3 className="mt-2 font-display text-2xl font-semibold">{page.page_title || page.url}</h3>
                      <a href={page.url} target="_blank" rel="noreferrer" className="mt-1 block break-all text-xs underline">{page.url}</a>
                      <MarkupReview page={page} />
                      {Object.keys(page.ratings ?? {}).length ? <dl className="mt-5 grid gap-3 border-t border-black/10 pt-4 sm:grid-cols-2">{Object.entries(page.ratings).map(([key, value]) => <div key={key}><dt className="text-xs font-semibold capitalize text-[#9a5f34]">{label(key)}</dt><dd className="mt-1 text-sm text-black/65">{value}/5</dd></div>)}</dl> : null}
                      {Object.values(page.answers ?? {}).some(Boolean) ? <details className="mt-5 border-t border-black/10 pt-4"><summary className="cursor-pointer text-xs font-semibold">Optional written survey</summary><dl className="mt-4 grid gap-4 md:grid-cols-2">{Object.entries(page.answers ?? {}).filter(([, value]) => value).map(([key, value]) => <div key={key}><dt className="text-xs font-semibold capitalize text-[#9a5f34]">{label(key)}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-black/65">{value}</dd></div>)}</dl></details> : null}
                      {page.commentary ? <div className="mt-5 border-t border-black/10 pt-4"><p className="text-xs font-semibold">General page notes</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-black/65">{page.commentary}</p></div> : null}
                    </section>
                  ))}
                </div>
              </details>
            </article>
          ))}
          {!sessions.length && !loadError ? <p className="portal-panel p-6 text-sm text-black/60">No client feedback sessions have been started yet.</p> : null}
        </div>
      </div>
    </PortalShell>
  );
}
