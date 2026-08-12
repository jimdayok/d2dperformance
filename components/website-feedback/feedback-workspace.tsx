"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Check, ChevronRight, ExternalLink, LoaderCircle, Monitor, Plus, Save, Send, ShieldCheck } from "lucide-react";
import { AltchaVerification } from "@/components/website-feedback/altcha-verification";
import { normalizeReviewUrl, overallQuestions, pageQuestions } from "@/lib/website-feedback-schema";

type SavedPage = { id: string; url: string; page_title: string; answers: Record<string, string>; page_score: number; commentary: string; updated_at: string };
type SessionIdentity = { id: string; token: string };

const blankAnswers = () => Object.fromEntries(pageQuestions.map((question) => [question.id, ""]));
const blankOverall = () => Object.fromEntries(overallQuestions.map((question) => [question.id, ""]));

function sessionStorageKey(id: string) { return `d2d-website-feedback:${id}`; }

export function FeedbackWorkspace({ initialUrl, initialSessionId, sourceSiteSlug }: { initialUrl: string; initialSessionId: string; sourceSiteSlug: string }) {
  const [identity, setIdentity] = useState<SessionIdentity | null>(null);
  const [restoring, setRestoring] = useState(Boolean(initialSessionId));
  const [sessionError, setSessionError] = useState("");
  const [savedPages, setSavedPages] = useState<SavedPage[]>([]);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [loadedUrl, setLoadedUrl] = useState(initialUrl);
  const [pageTitle, setPageTitle] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>(blankAnswers);
  const [pageScore, setPageScore] = useState(3);
  const [commentary, setCommentary] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [showFinal, setShowFinal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [satisfaction, setSatisfaction] = useState(8);
  const [approvalStatus, setApprovalStatus] = useState<"needs_revision" | "nearly_ready" | "approved">("needs_revision");
  const [overallAnswers, setOverallAnswers] = useState<Record<string, string>>(blankOverall);
  const frameRef = useRef<HTMLIFrameElement>(null);

  const snapshot = useMemo(() => JSON.stringify({ loadedUrl, pageTitle, answers, pageScore, commentary }), [loadedUrl, pageTitle, answers, pageScore, commentary]);
  const dirty = Boolean(identity && savedSnapshot && snapshot !== savedSnapshot);

  const loadSavedPage = useCallback((page: SavedPage) => {
    setCurrentUrl(page.url); setLoadedUrl(page.url); setPageTitle(page.page_title ?? "");
    setAnswers({ ...blankAnswers(), ...(page.answers ?? {}) }); setPageScore(page.page_score ?? 3); setCommentary(page.commentary ?? "");
    setSavedSnapshot(JSON.stringify({ loadedUrl: page.url, pageTitle: page.page_title ?? "", answers: { ...blankAnswers(), ...(page.answers ?? {}) }, pageScore: page.page_score ?? 3, commentary: page.commentary ?? "" }));
    setMessage("");
  }, []);

  useEffect(() => {
    if (!initialSessionId) return;
    async function restore() {
      await Promise.resolve();
      const token = window.localStorage.getItem(sessionStorageKey(initialSessionId));
      if (!token) { setSessionError("This browser does not have the private key for that review. Start a new review or reopen the original private link."); setRestoring(false); return; }
      try {
        const response = await fetch(`/api/website-feedback/sessions/${initialSessionId}`, { headers: { "x-feedback-token": token } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "The saved review could not be restored.");
        const pages = (data.pages ?? []) as SavedPage[]; setSavedPages(pages); setIdentity({ id: initialSessionId, token });
        if (pages.length) loadSavedPage(pages.at(-1)!); else { setLoadedUrl(String(data.session.initial_url)); setCurrentUrl(String(data.session.initial_url)); setSavedSnapshot(JSON.stringify({ loadedUrl: String(data.session.initial_url), pageTitle: "", answers: blankAnswers(), pageScore: 3, commentary: "" })); }
      } catch (error) { setSessionError(error instanceof Error ? error.message : "The review could not be restored."); }
      finally { setRestoring(false); }
    }
    void restore();
  }, [initialSessionId, loadSavedPage]);

  useEffect(() => {
    const receiveLocation = (event: MessageEvent) => {
      const payload = event.data as { type?: string; url?: string; title?: string } | null;
      if (!payload || payload.type !== "d2d-feedback-location" || !payload.url || dirty) return;
      try { const nextUrl = normalizeReviewUrl(payload.url); setCurrentUrl(nextUrl); setLoadedUrl(nextUrl); setPageTitle(payload.title ?? ""); }
      catch { /* Ignore invalid messages from embedded pages. */ }
    };
    window.addEventListener("message", receiveLocation);
    return () => window.removeEventListener("message", receiveLocation);
  }, [dirty]);

  async function startReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setWorking(true); setSessionError("");
    const form = new FormData(event.currentTarget); const altcha = String(form.get("altcha") ?? "");
    try {
      const normalizedUrl = normalizeReviewUrl(String(form.get("initialUrl") ?? ""));
      const response = await fetch("/api/website-feedback/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ clientName: form.get("clientName"), clientEmail: form.get("clientEmail"), company: form.get("company"), initialUrl: normalizedUrl, altcha, sourceSiteSlug: sourceSiteSlug || null }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "The review could not be started.");
      const nextIdentity = { id: String(data.session.id), token: String(data.session.accessToken) };
      window.localStorage.setItem(sessionStorageKey(nextIdentity.id), nextIdentity.token); setIdentity(nextIdentity); setCurrentUrl(normalizedUrl); setLoadedUrl(normalizedUrl);
      const nextSnapshot = JSON.stringify({ loadedUrl: normalizedUrl, pageTitle: "", answers: blankAnswers(), pageScore: 3, commentary: "" }); setSavedSnapshot(nextSnapshot);
      const url = new URL(window.location.href); url.searchParams.set("session", nextIdentity.id); url.searchParams.set("url", normalizedUrl); window.history.replaceState({}, "", url);
    } catch (error) { setSessionError(error instanceof Error ? error.message : "The review could not be started."); }
    finally { setWorking(false); }
  }

  function loadPage() {
    if (dirty) { setMessage("Save this page before loading another page."); return; }
    try {
      const nextUrl = normalizeReviewUrl(currentUrl); const existing = savedPages.find((page) => page.url === nextUrl);
      if (existing) { loadSavedPage(existing); return; }
      setCurrentUrl(nextUrl); setLoadedUrl(nextUrl); setPageTitle(""); setAnswers(blankAnswers()); setPageScore(3); setCommentary("");
      setSavedSnapshot(JSON.stringify({ loadedUrl: nextUrl, pageTitle: "", answers: blankAnswers(), pageScore: 3, commentary: "" })); setMessage("New page loaded. Add feedback, then save it before moving on.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Enter a valid website address."); }
  }

  async function savePage() {
    if (!identity) return; setWorking(true); setMessage("Saving page feedback…");
    try {
      const response = await fetch(`/api/website-feedback/sessions/${identity.id}/pages`, { method: "PUT", headers: { "content-type": "application/json", "x-feedback-token": identity.token }, body: JSON.stringify({ url: loadedUrl, pageTitle, answers, pageScore, commentary }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "The page could not be saved.");
      const page = data.page as SavedPage; setSavedPages((current) => [...current.filter((item) => item.url !== page.url), page]);
      setSavedSnapshot(snapshot); setMessage("Page feedback saved. You can now load another page.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The page could not be saved."); }
    finally { setWorking(false); }
  }

  async function submitReview() {
    if (!identity || dirty) { setMessage("Save the current page before submitting the full review."); return; }
    setWorking(true); setMessage("Sending your review to D2D Digital…");
    try {
      const response = await fetch(`/api/website-feedback/sessions/${identity.id}/submit`, { method: "POST", headers: { "content-type": "application/json", "x-feedback-token": identity.token }, body: JSON.stringify({ satisfactionScore: satisfaction, approvalStatus, overallAnswers }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "The review could not be submitted.");
      setSubmitted(true); setShowFinal(false); setMessage("Review submitted. D2D Digital received the complete page-by-page record.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The review could not be submitted. Your saved notes are still available."); }
    finally { setWorking(false); }
  }

  if (restoring) return <div className="feedback-loading"><LoaderCircle className="animate-spin" /><p>Restoring your private review…</p></div>;
  if (!identity) return <StartReviewForm initialUrl={initialUrl} sourceSiteSlug={sourceSiteSlug} onSubmit={startReview} working={working} error={sessionError} />;

  return (
    <div className="feedback-app">
      <header className="feedback-header">
        <a href="/digital" className="feedback-brand"><span>D2D</span><strong>DIGITAL_</strong></a>
        <div className="feedback-header-copy"><p>Website review workspace</p><span><ShieldCheck size={14} /> Private, saved page by page</span></div>
        <button className="feedback-submit-top" type="button" onClick={() => setShowFinal(true)} disabled={!savedPages.length || submitted}>Complete review <ChevronRight size={16} /></button>
      </header>
      <div className="feedback-layout">
        <aside className="feedback-panel">
          <div className="feedback-url-control">
            <label htmlFor="review-url">Page being reviewed</label>
            <div><input id="review-url" value={currentUrl} onChange={(event) => setCurrentUrl(event.target.value)} disabled={dirty || submitted} /><button type="button" onClick={loadPage} disabled={dirty || submitted}>Load</button></div>
            <p>{dirty ? "Save your notes before changing pages." : "Enter another page address, or use a saved page below."}</p>
          </div>
          {savedPages.length ? <div className="saved-page-strip"><p>Saved pages</p><div>{savedPages.map((page) => <button type="button" key={page.id} onClick={() => !dirty && loadSavedPage(page)} disabled={dirty}><Check size={13} />{page.page_title || new URL(page.url).pathname || "Homepage"}</button>)}<button type="button" onClick={() => { if (!dirty) { setCurrentUrl(loadedUrl); setMessage("Enter the next page address above."); } }} disabled={dirty}><Plus size={13} /> Add page</button></div></div> : null}
          <div className="feedback-questions">
            <div className="question-heading"><div><p>Page review</p><h1>{pageTitle || "Review this page"}</h1></div><span>{savedPages.find((page) => page.url === loadedUrl) ? "Saved page" : "Unsaved page"}</span></div>
            <label className="feedback-field"><span>Page name <small>Optional</small></span><input value={pageTitle} onChange={(event) => setPageTitle(event.target.value)} placeholder="Home, About, Services…" disabled={submitted} /></label>
            <fieldset className="rating-field"><legend>How well does this page work?</legend><div>{[1,2,3,4,5].map((score) => <button type="button" key={score} onClick={() => setPageScore(score)} className={pageScore === score ? "is-selected" : ""} aria-pressed={pageScore === score} disabled={submitted}>{score}</button>)}</div><p><span>Needs work</span><span>Excellent</span></p></fieldset>
            {pageQuestions.map((question, index) => <label className="feedback-field" key={question.id}><span><b>{String(index + 1).padStart(2, "0")}</b>{question.label}</span><small>{question.prompt}</small><textarea rows={4} value={answers[question.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} disabled={submitted} /></label>)}
            <label className="feedback-field"><span>Additional page notes</span><small>Add wording, examples, or anything the questions did not cover.</small><textarea rows={5} value={commentary} onChange={(event) => setCommentary(event.target.value)} disabled={submitted} /></label>
          </div>
          <div className="feedback-savebar"><button type="button" onClick={savePage} disabled={working || submitted}><Save size={16} />{working ? "Saving…" : "Save this page"}</button><p role="status" aria-live="polite">{message}</p></div>
        </aside>
        <section className="feedback-preview" aria-label="Desktop website preview">
          <div className="preview-toolbar"><div><Monitor size={16} /><span>Desktop preview · 1440 px</span></div><p>{loadedUrl}</p><a href={loadedUrl} target="_blank" rel="noreferrer">Open separately <ExternalLink size={14} /></a></div>
          <div className="preview-notice"><span>If a website blocks embedded viewing or appears blank, open it separately and keep this notes panel beside it.</span></div>
          <div className="desktop-stage"><iframe ref={frameRef} key={loadedUrl} src={loadedUrl} title={`Desktop preview of ${pageTitle || loadedUrl}`} sandbox="allow-forms allow-modals allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts" /></div>
        </section>
      </div>
      {showFinal ? <FinalReview satisfaction={satisfaction} setSatisfaction={setSatisfaction} approvalStatus={approvalStatus} setApprovalStatus={setApprovalStatus} answers={overallAnswers} setAnswers={setOverallAnswers} savedCount={savedPages.length} working={working} onClose={() => setShowFinal(false)} onSubmit={submitReview} /> : null}
    </div>
  );
}

function StartReviewForm({ initialUrl, sourceSiteSlug, onSubmit, working, error }: { initialUrl: string; sourceSiteSlug: string; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; working: boolean; error: string }) {
  return <main className="feedback-start"><div className="feedback-start-grid"><section><a href="/digital" className="feedback-brand"><span>D2D</span><strong>DIGITAL_</strong></a><p className="feedback-eyebrow">Client collaboration / Website iteration</p><h1>See the site.<br/><em>Shape what comes next.</em></h1><p className="feedback-start-lede">Review a desktop website page by page, answer the questions a marketing team would ask, and leave D2D Digital one organized record of every change.</p><ol><li><span>01</span>Load the website or preview link.</li><li><span>02</span>Save comments for each page you review.</li><li><span>03</span>Rate the full experience and submit it to Jim.</li></ol></section><form onSubmit={onSubmit}><div className="feedback-form-heading"><p>Start a private review</p><span>{sourceSiteSlug ? "Opened from Site Manager" : "D2D Digital feedback tool"}</span></div><label>Your name<input name="clientName" required minLength={2} autoComplete="name" /></label><label>Company<input name="company" required minLength={2} autoComplete="organization" /></label><label>Email<input name="clientEmail" type="email" required autoComplete="email" /></label><label>Website or preview URL<input name="initialUrl" type="url" required defaultValue={initialUrl} placeholder="https://preview.example.com" /></label><div className="altcha-wrap"><AltchaVerification /></div>{error ? <p className="feedback-error" role="alert">{error}</p> : null}<button type="submit" disabled={working}>{working ? <LoaderCircle className="animate-spin" /> : <ArrowUpRight />}{working ? "Creating review…" : "Open feedback workspace"}</button><small>Your review is private and protected by ALTCHA proof-of-work verification. No ad tracking or image puzzles.</small></form></div></main>;
}

function FinalReview({ satisfaction, setSatisfaction, approvalStatus, setApprovalStatus, answers, setAnswers, savedCount, working, onClose, onSubmit }: { satisfaction: number; setSatisfaction: (value: number) => void; approvalStatus: "needs_revision" | "nearly_ready" | "approved"; setApprovalStatus: (value: "needs_revision" | "nearly_ready" | "approved") => void; answers: Record<string,string>; setAnswers: React.Dispatch<React.SetStateAction<Record<string,string>>>; savedCount: number; working: boolean; onClose: () => void; onSubmit: () => void }) {
  return <div className="final-overlay" role="dialog" aria-modal="true" aria-labelledby="final-title"><section className="final-panel"><button className="final-close" type="button" onClick={onClose}>Continue page review</button><p className="feedback-eyebrow">Final perspective · {savedCount} saved {savedCount === 1 ? "page" : "pages"}</p><h2 id="final-title">How does the full site feel?</h2><fieldset className="satisfaction-field"><legend>Overall satisfaction</legend><div>{Array.from({length:10},(_,index)=>index+1).map((score)=><button type="button" key={score} onClick={()=>setSatisfaction(score)} className={score===satisfaction?"is-selected":""}>{score}</button>)}</div><p><span>Not there yet</span><strong>{satisfaction}/10</strong><span>Ready and confident</span></p></fieldset><label className="feedback-field"><span>Where is this iteration?</span><select value={approvalStatus} onChange={(event)=>setApprovalStatus(event.target.value as typeof approvalStatus)}><option value="needs_revision">Needs another revision</option><option value="nearly_ready">Nearly ready — minor changes</option><option value="approved">Approved for the next step</option></select></label>{overallQuestions.map((question)=><label className="feedback-field" key={question.id}><span>{question.label}</span><textarea rows={3} value={answers[question.id]??""} onChange={(event)=>setAnswers((current)=>({...current,[question.id]:event.target.value}))}/></label>)}<button className="final-submit" type="button" onClick={onSubmit} disabled={working}><Send size={17}/>{working?"Submitting review…":"Submit complete review to D2D"}</button></section></div>;
}
