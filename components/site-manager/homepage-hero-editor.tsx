"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { homepageHeroSchema, type HomepageHero } from "@/lib/site-manager/sites/alford-custom-homes/validation";

type Entry = { id: string; title: string; draft_data: HomepageHero; draft_revision: number; workflow_status: string; updated_at: string; published_at: string | null };

export function HomepageHeroEditor({ entry, siteSlug, canPublish }: { entry: Entry; siteSlug: string; canPublish: boolean }) {
  const storageKey = useMemo(() => `d2d-cms:${entry.id}:${entry.draft_revision}`, [entry.id, entry.draft_revision]);
  const { register, handleSubmit, formState: { errors, isDirty }, reset, subscribe } = useForm<HomepageHero>({ resolver: zodResolver(homepageHeroSchema), defaultValues: entry.draft_data });
  const [revision, setRevision] = useState(entry.draft_revision);
  const [status, setStatus] = useState(entry.workflow_status);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => { const local = window.localStorage.getItem(storageKey); if (!local) return; try { const parsed = homepageHeroSchema.safeParse(JSON.parse(local)); if (parsed.success) reset(parsed.data, { keepDirty: true }); } catch { window.localStorage.removeItem(storageKey); } }, [reset, storageKey]);
  useEffect(() => subscribe({ formState: { values: true }, callback: ({ values }) => window.localStorage.setItem(storageKey, JSON.stringify(values)) }), [storageKey, subscribe]);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (isDirty) event.preventDefault(); }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [isDirty]);

  async function save(values: HomepageHero) {
    setPending(true); setMessage("Saving draft…");
    const response = await fetch(`/api/cms/entries/${entry.id}/draft`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ siteSlug, modelKey: "homepage-hero", expectedRevision: revision, title: entry.title, data: values }) });
    const result = await response.json(); setPending(false);
    if (!response.ok) { setMessage(result.error ?? "Draft save failed."); return; }
    const saved = Array.isArray(result.entry) ? result.entry[0] : result.entry;
    setRevision(saved.draft_revision); setStatus(saved.workflow_status); window.localStorage.removeItem(storageKey); reset(values); setMessage("Draft saved. The live website is unchanged.");
  }

  async function workflow(action: "submit" | "publish") {
    setPending(true); setMessage(action === "submit" ? "Submitting for review…" : "Publishing…");
    const response = await fetch(`/api/cms/entries/${entry.id}/${action}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ siteSlug, modelKey: "homepage-hero", expectedRevision: revision, path: "/" }) });
    const result = await response.json(); setPending(false); setMessage(result.message ?? result.error ?? (action === "submit" ? "Submitted for review." : "Published.")); if (response.ok) setStatus(action === "submit" ? "in_review" : "published");
  }

  async function openPreview() {
    const response = await fetch("/api/cms/preview-token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ siteSlug, path: "/" }) });
    const result = await response.json(); if (response.ok) window.open(result.url, "_blank", "noopener,noreferrer"); else setMessage(result.error ?? "Preview could not be opened.");
  }

  const fieldClass = "mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-[#9a5f34]";
  return <form onSubmit={handleSubmit(save)} className="space-y-8"><header className="rounded-2xl border border-black/10 bg-white p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs uppercase tracking-wider text-black/45">Workflow status</p><p className="mt-1 font-semibold capitalize">{status.replaceAll("_", " ")}</p></div><div className="text-right text-xs text-black/50"><p>Draft revision {revision}</p><p>Last published {entry.published_at ? new Date(entry.published_at).toLocaleString() : "Never"}</p></div></div></header><section className="rounded-2xl border border-black/10 bg-white p-6"><h2 className="font-display text-2xl font-semibold">Hero copy</h2><p className="mt-1 text-sm text-black/55">Appears over the opening image on the Alford homepage.</p><div className="mt-6 grid gap-5"><label className="text-sm font-medium">Eyebrow <span aria-hidden="true">*</span><input {...register("eyebrow")} maxLength={60} className={fieldClass} /><span className="mt-1 block text-xs text-black/45">Up to 60 characters</span>{errors.eyebrow ? <span role="alert" className="text-xs text-red-700">{errors.eyebrow.message}</span> : null}</label><label className="text-sm font-medium">Heading *<textarea {...register("heading")} maxLength={140} rows={3} className={fieldClass} />{errors.heading ? <span role="alert" className="text-xs text-red-700">{errors.heading.message}</span> : null}</label><label className="text-sm font-medium">Supporting copy *<textarea {...register("supportingCopy")} maxLength={500} rows={4} className={fieldClass} /></label></div></section><section className="rounded-2xl border border-black/10 bg-white p-6"><h2 className="font-display text-2xl font-semibold">Actions and search preview</h2><div className="mt-5 grid gap-5 md:grid-cols-2"><label className="text-sm font-medium">Primary label<input {...register("primaryCta.label")} className={fieldClass} /></label><label className="text-sm font-medium">Primary approved path<input {...register("primaryCta.href")} className={fieldClass} /></label><label className="text-sm font-medium">Secondary label<input {...register("secondaryCta.label")} className={fieldClass} /></label><label className="text-sm font-medium">Secondary approved path<input {...register("secondaryCta.href")} className={fieldClass} /></label><label className="text-sm font-medium">SEO title<input {...register("seo.title")} maxLength={80} className={fieldClass} /><span className="text-xs text-black/45">Recommended: 50–60 characters</span></label><label className="text-sm font-medium">SEO description<textarea {...register("seo.description")} maxLength={200} rows={3} className={fieldClass} /><span className="text-xs text-black/45">Recommended: 140–160 characters</span></label></div></section><div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl border border-black/10 bg-white/95 p-4 shadow-xl backdrop-blur"><button type="submit" disabled={pending} className="rounded-lg bg-[#18201d] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Save Draft</button><button type="button" onClick={() => workflow("submit")} disabled={pending || isDirty} className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold disabled:opacity-40">Submit for Review</button>{canPublish ? <button type="button" onClick={() => workflow("publish")} disabled={pending || isDirty || status !== "in_review"} className="rounded-lg bg-[#9a5f34] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Publish</button> : null}<button type="button" onClick={openPreview} className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold">Open Preview in New Tab</button><p aria-live="polite" className="ml-auto text-sm text-black/60">{isDirty ? "Unsaved changes" : message || "All changes saved"}</p></div></form>;
}
