import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeReviewUrl, type PageFeedbackInput, type SubmitFeedbackInput } from "@/lib/website-feedback-schema";

const SESSION_TABLE = "website_feedback_sessions";
const PAGE_TABLE = "website_feedback_pages";

export function hashFeedbackToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createFeedbackAccessToken() {
  return randomBytes(32).toString("base64url");
}

export async function createFeedbackSession(input: {
  clientName: string;
  clientEmail: string;
  company: string;
  initialUrl: string;
  sourceSiteSlug?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const accessToken = createFeedbackAccessToken();
  const initialUrl = normalizeReviewUrl(input.initialUrl);
  const { data, error } = await supabase.from(SESSION_TABLE).insert({
    access_token_hash: hashFeedbackToken(accessToken),
    client_name: input.clientName,
    client_email: input.clientEmail.toLowerCase(),
    company: input.company,
    initial_url: initialUrl,
    source_site_slug: input.sourceSiteSlug || null,
  }).select("id,created_at").single();
  if (error) throw error;
  return { id: String(data.id), createdAt: String(data.created_at), accessToken, initialUrl };
}

async function requireSession(sessionId: string, accessToken: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from(SESSION_TABLE).select("*").eq("id", sessionId).eq("access_token_hash", hashFeedbackToken(accessToken)).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("This feedback session could not be found. Reopen your private review link and try again.");
  return data as Record<string, unknown>;
}

export async function getFeedbackSession(sessionId: string, accessToken: string) {
  const session = await requireSession(sessionId, accessToken);
  const supabase = createSupabaseAdminClient();
  const { data: pages, error } = await supabase.from(PAGE_TABLE).select("id,url,page_title,answers,page_score,commentary,created_at,updated_at").eq("session_id", sessionId).order("updated_at", { ascending: true });
  if (error) throw error;
  return { session, pages: pages ?? [] };
}

export async function saveFeedbackPage(sessionId: string, accessToken: string, page: PageFeedbackInput) {
  const session = await requireSession(sessionId, accessToken);
  if (session.status === "submitted") throw new Error("This review has already been submitted.");
  const url = normalizeReviewUrl(page.url);
  const supabase = createSupabaseAdminClient();
  const { count, error: countError } = await supabase.from(PAGE_TABLE).select("id", { count: "exact", head: true }).eq("session_id", sessionId);
  if (countError) throw countError;
  if ((count ?? 0) >= 75) {
    const { data: existing } = await supabase.from(PAGE_TABLE).select("id").eq("session_id", sessionId).eq("url", url).maybeSingle();
    if (!existing) throw new Error("This review has reached the 75-page limit. Submit the saved review or contact D2D Digital.");
  }
  const { data, error } = await supabase.from(PAGE_TABLE).upsert({
    session_id: sessionId,
    url,
    page_title: page.pageTitle,
    answers: page.answers,
    page_score: page.pageScore,
    commentary: page.commentary,
    updated_at: new Date().toISOString(),
  }, { onConflict: "session_id,url" }).select("id,url,page_title,answers,page_score,commentary,created_at,updated_at").single();
  if (error) throw error;
  await supabase.from(SESSION_TABLE).update({ updated_at: new Date().toISOString() }).eq("id", sessionId);
  return data;
}

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function answersToText(answers: Record<string, string>) {
  return Object.entries(answers).map(([key, value]) => `${key.replaceAll("_", " ")}: ${value || "Not provided"}`).join("\n");
}

function answersToHtml(answers: Record<string, string>) {
  return Object.entries(answers).map(([key, value]) => `<div style="margin:0 0 14px"><strong style="display:block;text-transform:capitalize;color:#9a5f34">${escapeHtml(key.replaceAll("_", " "))}</strong><span>${escapeHtml(value || "Not provided").replaceAll("\n", "<br />")}</span></div>`).join("");
}

async function sendFeedbackEmail(session: Record<string, unknown>, pages: Array<Record<string, unknown>>, overall: SubmitFeedbackInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.WEBSITE_FEEDBACK_FROM_EMAIL ?? process.env.BRAND_DISCOVERY_FROM_EMAIL;
  const to = process.env.WEBSITE_FEEDBACK_TO_EMAIL ?? "jim@d2dmktg.com";
  if (!apiKey || !from) throw new Error("Feedback email delivery is not configured. Your page notes remain saved.");
  const pageText = pages.map((page, index) => `PAGE ${index + 1}: ${page.page_title || page.url}\nURL: ${page.url}\nPage score: ${page.page_score}/5\n${answersToText((page.answers ?? {}) as Record<string, string>)}\nAdditional commentary: ${page.commentary || "None"}`).join("\n\n---\n\n");
  const text = `Website feedback from ${session.client_name} — ${session.company}\nEmail: ${session.client_email}\nOverall satisfaction: ${overall.satisfactionScore}/10\nApproval status: ${overall.approvalStatus.replaceAll("_", " ")}\n\nOVERALL REVIEW\n${answersToText(overall.overallAnswers)}\n\nPAGE-BY-PAGE REVIEW\n${pageText}`;
  const pageHtml = pages.map((page, index) => `<section style="margin:28px 0;padding:22px;border:1px solid #ded4c9;border-radius:14px;background:#fff"><p style="margin:0;color:#9a5f34;font-size:11px;letter-spacing:.18em;text-transform:uppercase">Page ${index + 1} · ${escapeHtml(String(page.page_score))}/5</p><h2 style="margin:8px 0 4px;font-family:Georgia,serif">${escapeHtml(String(page.page_title || page.url))}</h2><p style="margin:0 0 18px"><a href="${escapeHtml(String(page.url))}">${escapeHtml(String(page.url))}</a></p>${answersToHtml((page.answers ?? {}) as Record<string, string>)}<strong>Additional commentary</strong><p>${escapeHtml(String(page.commentary || "None")).replaceAll("\n", "<br />")}</p></section>`).join("");
  const html = `<div style="font-family:Arial,sans-serif;max-width:820px;margin:auto;color:#18201d;line-height:1.65"><header style="padding:30px;background:#18201d;color:#fff"><p style="margin:0;color:#7ee8ee;letter-spacing:.22em;text-transform:uppercase;font-size:11px">D2D Digital · Client Review</p><h1 style="font-family:Georgia,serif;font-size:38px;margin:12px 0 4px">${escapeHtml(String(session.company))}</h1><p style="margin:0">${escapeHtml(String(session.client_name))} · ${escapeHtml(String(session.client_email))}</p></header><div style="padding:28px;background:#f6f0e8"><h2 style="font-family:Georgia,serif">Overall satisfaction: ${overall.satisfactionScore}/10</h2><p><strong>Review status:</strong> ${escapeHtml(overall.approvalStatus.replaceAll("_", " "))}</p>${answersToHtml(overall.overallAnswers)}${pageHtml}</div></div>`;
  const resend = new Resend(apiKey);
  const delivery = await resend.emails.send({ from, to, replyTo: String(session.client_email), subject: `Website Feedback: ${session.company} (${overall.satisfactionScore}/10)`, text, html });
  if (delivery.error) throw new Error(`Feedback email delivery was rejected: ${delivery.error.message}`);
}

export async function submitFeedbackSession(sessionId: string, accessToken: string, overall: SubmitFeedbackInput) {
  const { session, pages } = await getFeedbackSession(sessionId, accessToken);
  if (session.status === "submitted") return { submittedAt: session.submitted_at, alreadySubmitted: true };
  if (!pages.length) throw new Error("Save feedback for at least one page before submitting the review.");
  await sendFeedbackEmail(session, pages as Array<Record<string, unknown>>, overall);
  const submittedAt = new Date().toISOString();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from(SESSION_TABLE).update({ satisfaction_score: overall.satisfactionScore, approval_status: overall.approvalStatus, overall_answers: overall.overallAnswers, status: "submitted", submitted_at: submittedAt, updated_at: submittedAt, email_sent_at: submittedAt }).eq("id", sessionId);
  if (error) throw error;
  return { submittedAt, alreadySubmitted: false };
}
