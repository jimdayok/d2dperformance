"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatReviewValue, type ReviewChange } from "@/lib/site-manager/review-diff";

type Props = {
  entryId: string;
  title: string;
  revision: number;
  siteSlug: string;
  modelKey: string;
  publishPath: string;
  previewHash: string;
  editorHref: string;
  initialPublication: boolean;
  changes: ReviewChange[];
};

export function ReviewQueueEntry(props: Props) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<"publish" | "changes" | "preview" | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function readPayload(response: Response) {
    return await response.json().catch(() => ({})) as { error?: string; message?: string; url?: string; revalidated?: boolean };
  }

  async function openPreview() {
    setPending("preview"); setMessage(""); setIsError(false);
    const response = await fetch("/api/cms/preview-token", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ siteSlug: props.siteSlug, path: props.publishPath }),
    });
    const payload = await readPayload(response); setPending(null);
    if (!response.ok || !payload.url) {
      setIsError(true); setMessage(payload.error ?? "Preview could not be opened."); return;
    }
    window.open(`${payload.url}${props.previewHash}`, "_blank", "noopener,noreferrer");
  }

  async function publish() {
    if (!window.confirm(`Approve and publish revision ${props.revision} of ${props.title}? This will update the live site.`)) return;
    setPending("publish"); setMessage("Publishing approved changes…"); setIsError(false);
    const response = await fetch(`/api/cms/entries/${props.entryId}/publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        siteSlug: props.siteSlug,
        modelKey: props.modelKey,
        expectedRevision: props.revision,
        path: props.publishPath,
      }),
    });
    const payload = await readPayload(response); setPending(null);
    if (!response.ok) {
      setIsError(true); setMessage(payload.error ?? "Approval and publishing failed."); return;
    }
    setMessage(payload.revalidated === false
      ? "Published, but the live-site refresh failed. Check Publish Activity before retrying revalidation."
      : "Approved, published, and sent for live-site refresh.");
    window.setTimeout(() => router.refresh(), 1400);
  }

  async function requestChanges(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedNote = note.trim();
    if (!trimmedNote) { setIsError(true); setMessage("Enter a review note explaining what must change."); return; }
    setPending("changes"); setMessage("Recording requested changes…"); setIsError(false);
    const response = await fetch(`/api/cms/entries/${props.entryId}/request-changes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ siteSlug: props.siteSlug, note: trimmedNote, expectedRevision: props.revision }),
    });
    const payload = await readPayload(response); setPending(null);
    if (!response.ok) {
      setIsError(true); setMessage(payload.error ?? "Changes could not be requested."); return;
    }
    setMessage(payload.message ?? "Changes requested and review note recorded.");
    window.setTimeout(() => router.refresh(), 900);
  }

  return (
    <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a5f34]">Awaiting review</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">{props.title}</h2>
          <p className="mt-1 text-sm text-black/50">Draft revision {props.revision}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={props.editorHref} className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold">Open full editor</Link>
          <button type="button" onClick={openPreview} disabled={pending !== null} className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold disabled:opacity-45">
            {pending === "preview" ? "Opening…" : "Preview draft"}
          </button>
        </div>
      </header>

      <section className="mt-6" aria-label={`Changes in ${props.title}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-xl font-semibold">What changed</h3>
          <p className="text-xs text-black/50">{props.initialPublication ? "Initial publication" : `${props.changes.length} changed field${props.changes.length === 1 ? "" : "s"}`}</p>
        </div>
        {props.changes.length ? (
          <div className="mt-3 grid gap-3">
            {props.changes.map((change) => (
              <div key={change.path} className="overflow-hidden rounded-xl border border-black/10">
                <p className="border-b border-black/8 bg-black/[0.025] px-4 py-2 text-sm font-semibold">{change.label}</p>
                <div className="grid md:grid-cols-2">
                  <div className="border-b border-black/8 bg-red-50/55 p-4 md:border-r md:border-b-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-red-800/70">Published</p>
                    <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm leading-6 text-black/70">{formatReviewValue(change.before)}</pre>
                  </div>
                  <div className="bg-emerald-50/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-900/70">Submitted</p>
                    <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-sm leading-6">{formatReviewValue(change.after)}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">No content differences were found between the published and submitted versions.</p>}
      </section>

      <div className="mt-6 grid gap-4 border-t border-black/8 pt-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <form onSubmit={requestChanges} className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <label className="text-sm font-medium sm:col-span-2" htmlFor={`review-note-${props.entryId}`}>Request changes with a required note</label>
          <textarea id={`review-note-${props.entryId}`} value={note} onChange={(event) => setNote(event.target.value)} required maxLength={5000} rows={2} placeholder="Explain exactly what should be revised" className="min-w-0 rounded-lg border border-black/15 px-3 py-2 text-sm" />
          <button disabled={pending !== null} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-800 disabled:opacity-45">{pending === "changes" ? "Recording…" : "Request changes"}</button>
        </form>
        <button type="button" onClick={publish} disabled={pending !== null || props.changes.length === 0} className="rounded-lg bg-[#9a5f34] px-5 py-3 text-sm font-semibold !text-white disabled:opacity-45">
          {pending === "publish" ? "Publishing…" : "Approve & Publish"}
        </button>
      </div>
      {message ? <p role={isError ? "alert" : "status"} aria-live="polite" className={`mt-4 text-sm ${isError ? "font-medium text-red-700" : "text-black/60"}`}>{message}</p> : null}
    </article>
  );
}
