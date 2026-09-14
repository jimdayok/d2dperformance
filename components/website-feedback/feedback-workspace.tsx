"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Check, ChevronRight, ExternalLink, FileText, LoaderCircle, Monitor, Plus, Save, Send, ShieldCheck } from "lucide-react";
import { AltchaVerification } from "@/components/website-feedback/altcha-verification";
import { MarkupCanvas } from "@/components/website-feedback/markup-canvas";
import { normalizeReviewUrl, overallQuestions, pageQuestions, pageRatings, type MarkupNote } from "@/lib/website-feedback-schema";

type SavedPage = { id: string; url: string; page_title: string; answers: Record<string, string>; ratings: Record<string, number>; annotations: MarkupNote[]; page_score: number; commentary: string; updated_at: string };
type SessionIdentity = { id: string; token: string };
type PageDraft = { url: string; pageTitle: string; answers: Record<string, string>; ratings: Record<string, number>; annotations: MarkupNote[]; pageScore: number; commentary: string };

const blankAnswers = () => Object.fromEntries(pageQuestions.map((question) => [question.id, ""]));
const blankOverall = () => Object.fromEntries(overallQuestions.map((question) => [question.id, ""]));
const blankRatings = () => Object.fromEntries(pageRatings.map((rating) => [rating.id, 3]));

function sessionStorageKey(id: string) { return `d2d-website-feedback:${id}`; }
function pageLabel(url: string, title?: string) {
  if (title) return title;
  try { return new URL(url).pathname === "/" ? "Homepage" : new URL(url).pathname.split("/").filter(Boolean).at(-1)?.replaceAll("-", " ") || "Page"; }
  catch { return "Page"; }
}

export function FeedbackWorkspace({ initialUrl, initialSessionId, sourceSiteSlug }: { initialUrl: string; initialSessionId: string; sourceSiteSlug: string }) {
  const [identity, setIdentity] = useState<SessionIdentity | null>(null);
  const [restoring, setRestoring] = useState(Boolean(initialSessionId));
  const [sessionError, setSessionError] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [savedPages, setSavedPages] = useState<SavedPage[]>([]);
  const [pageDrafts, setPageDrafts] = useState<Record<string, PageDraft>>({});
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [loadedUrl, setLoadedUrl] = useState(initialUrl);
  const [pageTitle, setPageTitle] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>(blankAnswers);
  const [ratings, setRatings] = useState<Record<string, number>>(blankRatings);
  const [annotations, setAnnotations] = useState<MarkupNote[]>([]);
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

  const snapshot = useMemo(() => JSON.stringify({ loadedUrl, pageTitle, answers, ratings, annotations, pageScore, commentary }), [loadedUrl, pageTitle, answers, ratings, annotations, pageScore, commentary]);
  const dirty = Boolean(identity && savedSnapshot && snapshot !== savedSnapshot);

  const currentDraft = useCallback((): PageDraft => ({ url: loadedUrl, pageTitle, answers, ratings, annotations, pageScore, commentary }), [answers, annotations, commentary, loadedUrl, pageScore, pageTitle, ratings]);

  const blankSnapshot = useCallback((url: string) => JSON.stringify({ loadedUrl: url, pageTitle: "", answers: blankAnswers(), ratings: blankRatings(), annotations: [], pageScore: 3, commentary: "" }), []);

  const loadSavedPage = useCallback((page: SavedPage) => {
    setCurrentUrl(page.url); setLoadedUrl(page.url); setPageTitle(page.page_title ?? "");
    setAnswers({ ...blankAnswers(), ...(page.answers ?? {}) }); setRatings({ ...blankRatings(), ...(page.ratings ?? {}) }); setAnnotations(page.annotations ?? []); setPageScore(page.page_score ?? 3); setCommentary(page.commentary ?? "");
    setSavedSnapshot(JSON.stringify({ loadedUrl: page.url, pageTitle: page.page_title ?? "", answers: { ...blankAnswers(), ...(page.answers ?? {}) }, ratings: { ...blankRatings(), ...(page.ratings ?? {}) }, annotations: page.annotations ?? [], pageScore: page.page_score ?? 3, commentary: page.commentary ?? "" }));
    setMessage("");
  }, []);

  const loadDraftPage = useCallback((draft: PageDraft, savedPage?: SavedPage) => {
    setCurrentUrl(draft.url); setLoadedUrl(draft.url); setPageTitle(draft.pageTitle);
    setAnswers({ ...blankAnswers(), ...draft.answers }); setRatings({ ...blankRatings(), ...draft.ratings }); setAnnotations(draft.annotations); setPageScore(draft.pageScore); setCommentary(draft.commentary);
    setSavedSnapshot(savedPage
      ? JSON.stringify({ loadedUrl: savedPage.url, pageTitle: savedPage.page_title ?? "", answers: { ...blankAnswers(), ...(savedPage.answers ?? {}) }, ratings: { ...blankRatings(), ...(savedPage.ratings ?? {}) }, annotations: savedPage.annotations ?? [], pageScore: savedPage.page_score ?? 3, commentary: savedPage.commentary ?? "" })
      : blankSnapshot(draft.url));
    setMessage("Unsaved notes restored for this page. Save this page when you are ready.");
  }, [blankSnapshot]);

  const switchPage = useCallback((value: string, reportedTitle = "") => {
    try {
      const nextUrl = normalizeReviewUrl(value);
      if (nextUrl === loadedUrl) {
        setCurrentUrl(nextUrl);
        if (reportedTitle && !pageTitle) setPageTitle(reportedTitle);
        return;
      }
      if (dirty) {
        const draft = currentDraft();
        setPageDrafts((current) => ({ ...current, [draft.url]: draft }));
      }
      const savedPage = savedPages.find((page) => page.url === nextUrl);
      const draft = pageDrafts[nextUrl];
      if (draft) { loadDraftPage(draft, savedPage); return; }
      if (savedPage) { loadSavedPage(savedPage); return; }
      const nextAnswers = blankAnswers();
      const nextRatings = blankRatings();
      setCurrentUrl(nextUrl); setLoadedUrl(nextUrl); setPageTitle(reportedTitle); setAnswers(nextAnswers); setRatings(nextRatings); setAnnotations([]); setPageScore(3); setCommentary("");
      setSavedSnapshot(JSON.stringify({ loadedUrl: nextUrl, pageTitle: "", answers: nextAnswers, ratings: nextRatings, annotations: [], pageScore: 3, commentary: "" }));
      setMessage(dirty ? "New page detected. Your previous page notes remain available as an unsaved draft." : "New page detected. Add feedback and save it as a separate page note.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Enter a valid website address."); }
  }, [currentDraft, dirty, loadDraftPage, loadSavedPage, loadedUrl, pageDrafts, pageTitle, savedPages]);

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
        const pages = (data.pages ?? []) as SavedPage[]; setSavedPages(pages); setIdentity({ id: initialSessionId, token }); setSubmitterEmail(String(data.session.client_email ?? "")); setSubmitted(data.session.status === "submitted");
        if (pages.length) loadSavedPage(pages.at(-1)!); else { setLoadedUrl(String(data.session.initial_url)); setCurrentUrl(String(data.session.initial_url)); setSavedSnapshot(blankSnapshot(String(data.session.initial_url))); }
      } catch (error) { setSessionError(error instanceof Error ? error.message : "The review could not be restored."); }
      finally { setRestoring(false); }
    }
    void restore();
  }, [blankSnapshot, initialSessionId, loadSavedPage]);

  useEffect(() => {
    const receiveLocation = (event: MessageEvent) => {
      const payload = event.data as { type?: string; url?: string; title?: string } | null;
      if (event.source !== frameRef.current?.contentWindow || !payload || payload.type !== "d2d-feedback-location" || !payload.url || submitted) return;
      switchPage(payload.url, payload.title ?? "");
    };
    window.addEventListener("message", receiveLocation);
    return () => window.removeEventListener("message", receiveLocation);
  }, [submitted, switchPage]);

  async function startReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setWorking(true); setSessionError("");
    const form = new FormData(event.currentTarget); const altcha = String(form.get("altcha") ?? "");
    try {
      const normalizedUrl = normalizeReviewUrl(String(form.get("initialUrl") ?? ""));
      const clientEmail = String(form.get("clientEmail") ?? "");
      const response = await fetch("/api/website-feedback/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ clientName: form.get("clientName"), clientEmail, company: form.get("company"), initialUrl: normalizedUrl, altcha, sourceSiteSlug: sourceSiteSlug || null }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "The review could not be started.");
      const nextIdentity = { id: String(data.session.id), token: String(data.session.accessToken) };
      window.localStorage.setItem(sessionStorageKey(nextIdentity.id), nextIdentity.token); setIdentity(nextIdentity); setSubmitterEmail(clientEmail); setCurrentUrl(normalizedUrl); setLoadedUrl(normalizedUrl);
      const nextSnapshot = blankSnapshot(normalizedUrl); setSavedSnapshot(nextSnapshot);
      const url = new URL(window.location.href); url.searchParams.set("session", nextIdentity.id); url.searchParams.set("url", normalizedUrl); window.history.replaceState({}, "", url);
    } catch (error) { setSessionError(error instanceof Error ? error.message : "The review could not be started."); }
    finally { setWorking(false); }
  }

  function loadPage() {
    switchPage(currentUrl);
  }

  async function savePage() {
    if (!identity) return; setWorking(true); setMessage("Saving page feedback…");
    try {
      const response = await fetch(`/api/website-feedback/sessions/${identity.id}/pages`, { method: "PUT", headers: { "content-type": "application/json", "x-feedback-token": identity.token }, body: JSON.stringify({ url: loadedUrl, pageTitle, answers, ratings, annotations, pageScore, commentary }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "The page could not be saved.");
      const page = data.page as SavedPage; setSavedPages((current) => [...current.filter((item) => item.url !== page.url), page]); setPageDrafts((current) => { const next = { ...current }; delete next[page.url]; return next; });
      setSavedSnapshot(snapshot); setMessage("Page feedback saved. You can now load another page.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "The page could not be saved."); }
    finally { setWorking(false); }
  }

  async function submitReview() {
    if (!identity || dirty || Object.keys(pageDrafts).length) { setMessage("Save every page marked Draft before submitting the full review."); setShowFinal(false); return; }
    setWorking(true); setMessage("Sending your review to the D2D Digital and Marketing teams…");
    try {
      const response = await fetch(`/api/website-feedback/sessions/${identity.id}/submit`, { method: "POST", headers: { "content-type": "application/json", "x-feedback-token": identity.token }, body: JSON.stringify({ satisfactionScore: satisfaction, approvalStatus, overallAnswers }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "The review could not be submitted.");
      setSubmitted(true); setShowFinal(false); setMessage(`Review submitted. The complete page-by-page report was emailed to the D2D Digital and Marketing teams${submitterEmail ? ` and ${submitterEmail}` : " and the submitting party"}.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "The review could not be submitted. Your saved notes are still available."); }
    finally { setWorking(false); }
  }

  function openFinalReview() {
    if (dirty || Object.keys(pageDrafts).length) {
      setMessage("Save every page marked Draft, then use Submit notes & PDF again.");
      return;
    }
    if (!savedPages.length) {
      setMessage("Add a mark or page note and save this page before submitting.");
      return;
    }
    setShowFinal(true);
  }

  if (restoring) return <div className="feedback-loading"><LoaderCircle className="animate-spin" /><p>Restoring your private review…</p></div>;
  if (!identity) return <StartReviewForm initialUrl={initialUrl} sourceSiteSlug={sourceSiteSlug} onSubmit={startReview} working={working} error={sessionError} />;

  const unsavedCount = Object.keys(pageDrafts).length + (dirty && !pageDrafts[loadedUrl] ? 1 : 0);

  return (
    <div className="feedback-app">
      <header className="feedback-header">
        <a href="/digital" className="feedback-brand"><span>D2D</span><strong>DIGITAL_</strong></a>
        <div className="feedback-header-copy"><p>Website review workspace</p><span><ShieldCheck size={14} /> Private markup, saved page by page</span></div>
        <button className="feedback-submit-top" type="button" onClick={openFinalReview} disabled={submitted}><span><small>Final step</small><b>Submit notes &amp; PDF</b></span><ChevronRight size={17} /></button>
      </header>
      <div className="feedback-layout">
        <aside className="feedback-panel">
          <div className="feedback-url-control">
            <label htmlFor="review-url">Page being reviewed</label>
            <div><input id="review-url" value={currentUrl} onChange={(event) => setCurrentUrl(event.target.value)} disabled={submitted} /><button type="button" onClick={loadPage} disabled={submitted}>Load</button></div>
            <p>Navigate in the preview or enter a page address. Each URL keeps its own notes.</p>
          </div>
          {savedPages.length || Object.keys(pageDrafts).length ? <div className="saved-page-strip"><p>Pages in this review</p><div>{savedPages.filter((page) => !pageDrafts[page.url]).map((page) => <button type="button" key={page.id} onClick={() => switchPage(page.url)}><Check size={13} />{pageLabel(page.url, page.page_title)} <small>Saved</small></button>)}{Object.values(pageDrafts).map((draft) => <button type="button" key={draft.url} className="is-draft" onClick={() => switchPage(draft.url)}><Plus size={13} />{pageLabel(draft.url, draft.pageTitle)} <small>Draft</small></button>)}</div></div> : null}
          <div className="feedback-questions">
            <div className="question-heading"><div><p>Page review</p><h1>{pageTitle || pageLabel(loadedUrl)}</h1></div><span>{dirty || pageDrafts[loadedUrl] ? "Draft · save separately" : savedPages.find((page) => page.url === loadedUrl) ? "Saved page" : "New page"}</span></div>
            <div className="markup-count"><strong>{annotations.length}</strong><span>{annotations.length === 1 ? "mark on this page" : "marks on this page"}</span><small>Draw freehand, add an arrow, circle an area, or attach a note directly on the website.</small></div>
            <label className="feedback-field"><span>General notes for this page <small>Optional</small></span><small>Share anything that applies to the page as a whole.</small><textarea rows={5} value={commentary} onChange={(event) => setCommentary(event.target.value)} placeholder="What is working, what feels off, or what should the teams know?" disabled={submitted} /></label>
            <details className="feedback-optional">
              <summary><div><strong>Optional page survey</strong><span>Quick ratings and guided questions</span></div><ChevronRight size={17} /></summary>
              <div className="feedback-optional-body">
                <label className="feedback-field"><span>Page name <small>Optional</small></span><input value={pageTitle} onChange={(event) => setPageTitle(event.target.value)} placeholder="Home, About, Services…" disabled={submitted} /></label>
                <FivePointRating label="How well does this page work?" low="Needs work" high="Excellent" value={pageScore} onChange={setPageScore} disabled={submitted} />
                {pageRatings.map((rating) => <FivePointRating key={rating.id} label={rating.label} low={rating.low} high={rating.high} value={ratings[rating.id] ?? 3} onChange={(value) => setRatings((current) => ({ ...current, [rating.id]: value }))} disabled={submitted} />)}
                <details className="feedback-written-questions">
                  <summary>More guided questions <span>Optional</span></summary>
                  <div>{pageQuestions.map((question, index) => <label className="feedback-field" key={question.id}><span><b>{String(index + 1).padStart(2, "0")}</b>{question.label}</span><small>{question.prompt}</small><textarea rows={4} value={answers[question.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} disabled={submitted} /></label>)}</div>
                </details>
              </div>
            </details>
          </div>
          <div className="feedback-savebar"><button type="button" onClick={savePage} disabled={working || submitted}><Save size={16} />{working ? "Saving…" : "Save this page"}</button><p role="status" aria-live="polite">{message}</p></div>
        </aside>
        <section className="feedback-preview" aria-label="Desktop website preview">
          <div className="preview-toolbar"><div><Monitor size={16} /><span>Desktop preview · 1440 px</span></div><p>{loadedUrl}</p><a href={loadedUrl} target="_blank" rel="noreferrer">Open separately <ExternalLink size={14} /></a></div>
          <div className="preview-notice"><span>Browse to any page, then draw, add arrows, circle areas, or place notes. Save each page, then use <strong>Submit notes &amp; PDF</strong> in the corner.</span></div>
          <div className="desktop-stage"><MarkupCanvas annotations={annotations} onChange={setAnnotations} frameRef={frameRef} url={loadedUrl} title={pageTitle} disabled={submitted} /></div>
        </section>
      </div>
      {!showFinal && !submitted ? <aside className="feedback-submit-corner" aria-label="Submit website feedback"><span>When every page is saved</span><button type="button" onClick={dirty ? savePage : openFinalReview} disabled={working}><FileText size={18} />{dirty ? "Save this page first" : unsavedCount ? "Save drafts to submit" : "Submit notes & PDF"}</button><small>Your drawings and notes will be emailed as a marked-up PDF.</small></aside> : null}
      {showFinal ? <FinalReview satisfaction={satisfaction} setSatisfaction={setSatisfaction} approvalStatus={approvalStatus} setApprovalStatus={setApprovalStatus} answers={overallAnswers} setAnswers={setOverallAnswers} savedCount={savedPages.length} working={working} onClose={() => setShowFinal(false)} onSubmit={submitReview} /> : null}
    </div>
  );
}

function StartReviewForm({ initialUrl, sourceSiteSlug, onSubmit, working, error }: { initialUrl: string; sourceSiteSlug: string; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void; working: boolean; error: string }) {
  return <main className="feedback-start"><div className="feedback-start-grid"><section><a href="/digital" className="feedback-brand"><span>D2D</span><strong>DIGITAL_</strong></a><p className="feedback-eyebrow">Client collaboration / Website iteration</p><h1>See the site.<br/><em>Shape what comes next.</em></h1><p className="feedback-start-lede">Draw directly on every webpage, point to exact changes, attach replacement copy or picture notes, and email one marked-up PDF to the D2D Digital and Marketing teams.</p><ol><li><span>01</span>Browse every page you want to review.</li><li><span>02</span>Draw freehand, add arrows, circle areas, and place notes.</li><li><span>03</span>Save each page, then click Submit notes &amp; PDF in the corner.</li></ol></section><form onSubmit={onSubmit}><div className="feedback-form-heading"><p>Start a private review</p><span>{sourceSiteSlug ? "Opened from Site Manager" : "D2D Digital feedback tool"}</span></div><label>Your name<input name="clientName" required minLength={2} autoComplete="name" /></label><label>Company<input name="company" required minLength={2} autoComplete="organization" /></label><label>Email<input name="clientEmail" type="email" required autoComplete="email" /></label><label>Website or preview URL<input name="initialUrl" type="url" required defaultValue={initialUrl} placeholder="https://preview.example.com" /></label><div className="altcha-wrap"><AltchaVerification /></div>{error ? <p className="feedback-error" role="alert">{error}</p> : null}<button type="submit" disabled={working}>{working ? <LoaderCircle className="animate-spin" /> : <ArrowUpRight />}{working ? "Creating review…" : "Open feedback workspace"}</button><small>Your review is private and protected by ALTCHA proof-of-work verification. No ad tracking or image puzzles.</small></form></div></main>;
}

function FivePointRating({ label, low, high, value, onChange, disabled }: { label: string; low: string; high: string; value: number; onChange: (value: number) => void; disabled: boolean }) {
  return <fieldset className="rating-field"><legend>{label}</legend><div>{[1,2,3,4,5].map((score) => <button type="button" key={score} onClick={() => onChange(score)} className={value === score ? "is-selected" : ""} aria-pressed={value === score} disabled={disabled}>{score}</button>)}</div><p><span>{low}</span><span>{high}</span></p></fieldset>;
}

function FinalReview({ satisfaction, setSatisfaction, approvalStatus, setApprovalStatus, answers, setAnswers, savedCount, working, onClose, onSubmit }: { satisfaction: number; setSatisfaction: (value: number) => void; approvalStatus: "needs_revision" | "nearly_ready" | "approved"; setApprovalStatus: (value: "needs_revision" | "nearly_ready" | "approved") => void; answers: Record<string,string>; setAnswers: React.Dispatch<React.SetStateAction<Record<string,string>>>; savedCount: number; working: boolean; onClose: () => void; onSubmit: () => void }) {
  return <div className="final-overlay" role="dialog" aria-modal="true" aria-labelledby="final-title"><section className="final-panel"><button className="final-close" type="button" onClick={onClose}>Continue page review</button><p className="feedback-eyebrow">Final step · {savedCount} saved {savedCount === 1 ? "page" : "pages"}</p><h2 id="final-title">Submit your notes and marked-up PDF.</h2><div className="final-delivery-note"><FileText size={22}/><p><strong>Your drawings will be included.</strong><span>The D2D Digital and Marketing teams will receive a PDF showing every marked page and its written notes. A copy will also be emailed to you.</span></p></div><button className="final-submit final-submit-now" type="button" onClick={onSubmit} disabled={working}><Send size={17}/>{working?"Creating PDF and emailing review…":"Email notes & marked-up PDF now"}</button><fieldset className="satisfaction-field"><legend>Overall satisfaction</legend><div>{Array.from({length:10},(_,index)=>index+1).map((score)=><button type="button" key={score} onClick={()=>setSatisfaction(score)} className={score===satisfaction?"is-selected":""}>{score}</button>)}</div><p><span>Not there yet</span><strong>{satisfaction}/10</strong><span>Ready and confident</span></p></fieldset><label className="feedback-field"><span>Where is this iteration?</span><select value={approvalStatus} onChange={(event)=>setApprovalStatus(event.target.value as typeof approvalStatus)}><option value="needs_revision">Needs another revision</option><option value="nearly_ready">Nearly ready — minor changes</option><option value="approved">Approved for the next step</option></select></label>{overallQuestions.map((question)=><label className="feedback-field" key={question.id}><span>{question.label}</span><textarea rows={3} value={answers[question.id]??""} onChange={(event)=>setAnswers((current)=>({...current,[question.id]:event.target.value}))}/></label>)}<button className="final-submit" type="button" onClick={onSubmit} disabled={working}><Send size={17}/>{working?"Creating PDF and emailing review…":"Email notes & marked-up PDF"}</button></section></div>;
}
