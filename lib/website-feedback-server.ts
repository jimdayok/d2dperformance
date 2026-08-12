import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizeReviewUrl, overallQuestions, pageQuestions, type PageFeedbackInput, type SubmitFeedbackInput } from "@/lib/website-feedback-schema";

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

const pageQuestionLabels = Object.fromEntries(pageQuestions.map((question) => [question.id, question.label]));
const overallQuestionLabels = Object.fromEntries(overallQuestions.map((question) => [question.id, question.label]));

function answeredEntries(answers: Record<string, string>, labels: Record<string, string>) {
  return Object.entries(answers).filter(([, value]) => value.trim()).map(([key, value]) => ({ label: labels[key] ?? key.replaceAll("_", " "), value }));
}

function answersToText(answers: Record<string, string>, labels: Record<string, string>) {
  const entries = answeredEntries(answers, labels);
  return entries.length ? entries.map(({ label, value }) => `${label}: ${value}`).join("\n") : "No additional response provided.";
}

function answersToHtml(answers: Record<string, string>, labels: Record<string, string>) {
  const entries = answeredEntries(answers, labels);
  if (!entries.length) return `<p style="margin:0;color:#6d746f;font-size:14px">No additional response provided.</p>`;
  return entries.map(({ label, value }) => `<div style="margin:0 0 18px"><p style="margin:0 0 5px;color:#9a5f34;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${escapeHtml(label)}</p><p style="margin:0;color:#273330;font-size:15px;line-height:1.65">${escapeHtml(value).replaceAll("\n", "<br />")}</p></div>`).join("");
}

async function sendFeedbackEmail(session: Record<string, unknown>, pages: Array<Record<string, unknown>>, overall: SubmitFeedbackInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.WEBSITE_FEEDBACK_FROM_EMAIL ?? process.env.BRAND_DISCOVERY_FROM_EMAIL;
  const ownerEmail = process.env.WEBSITE_FEEDBACK_TO_EMAIL ?? "jim@d2dmktg.com";
  const clientEmail = String(session.client_email).toLowerCase();
  if (!apiKey || !from) throw new Error("Feedback email delivery is not configured. Your page notes remain saved.");
  const approvalLabel = overall.approvalStatus.replaceAll("_", " ");
  const pageText = pages.map((page, index) => `PAGE ${index + 1}: ${page.page_title || page.url}\nURL: ${page.url}\nPage score: ${page.page_score}/5\n${answersToText((page.answers ?? {}) as Record<string, string>, pageQuestionLabels)}\nAdditional commentary: ${page.commentary || "None"}`).join("\n\n---\n\n");
  const baseText = `Website feedback from ${session.client_name} — ${session.company}\nEmail: ${session.client_email}\nPages reviewed: ${pages.length}\nOverall satisfaction: ${overall.satisfactionScore}/10\nApproval status: ${approvalLabel}\n\nOVERALL REVIEW\n${answersToText(overall.overallAnswers, overallQuestionLabels)}\n\nPAGE-BY-PAGE REVIEW\n${pageText}`;
  const pageIndexHtml = pages.map((page, index) => `<tr><td style="padding:10px 0;border-bottom:1px solid #e5ded4;color:#9a5f34;font-size:12px;font-weight:700">${String(index + 1).padStart(2, "0")}</td><td style="padding:10px;border-bottom:1px solid #e5ded4"><a href="${escapeHtml(String(page.url))}" style="color:#18201d;font-weight:700;text-decoration:none">${escapeHtml(String(page.page_title || page.url))}</a></td><td style="padding:10px 0;border-bottom:1px solid #e5ded4;color:#0c7379;font-weight:700;text-align:right">${escapeHtml(String(page.page_score))}/5</td></tr>`).join("");
  const pageHtml = pages.map((page, index) => `<section style="margin:28px 0;padding:26px;border:1px solid #ded4c9;border-radius:14px;background:#fff"><p style="margin:0;color:#9a5f34;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase">Page ${index + 1} · ${escapeHtml(String(page.page_score))}/5</p><h2 style="margin:8px 0 4px;color:#18201d;font-family:Georgia,serif;font-size:27px;line-height:1.2">${escapeHtml(String(page.page_title || page.url))}</h2><p style="margin:0 0 22px;word-break:break-all"><a href="${escapeHtml(String(page.url))}" style="color:#0c7379;font-size:13px">${escapeHtml(String(page.url))}</a></p>${answersToHtml((page.answers ?? {}) as Record<string, string>, pageQuestionLabels)}${page.commentary ? `<div style="margin-top:22px;padding:18px;background:#f3eee6;border-left:4px solid #7ee8ee"><p style="margin:0 0 5px;color:#18201d;font-size:12px;font-weight:700;text-transform:uppercase">Additional page notes</p><p style="margin:0;color:#35423f;font-size:15px;line-height:1.65">${escapeHtml(String(page.commentary)).replaceAll("\n", "<br />")}</p></div>` : ""}</section>`).join("");
  const buildHtml = (recipient: "owner" | "client") => `<div style="display:none;max-height:0;overflow:hidden">${recipient === "client" ? "Your copy of the website review" : "A client website review is ready"} · ${pages.length} ${pages.length === 1 ? "page" : "pages"}</div><div style="margin:0;background:#ece8e0;padding:28px 12px;font-family:Arial,sans-serif;color:#18201d"><div style="max-width:820px;margin:auto;overflow:hidden;border-radius:16px;background:#f7f3ec;box-shadow:0 18px 50px rgba(24,32,29,.12)"><header style="padding:34px;background:#18201d;color:#fff"><p style="margin:0;color:#7ee8ee;font-size:11px;font-weight:700;letter-spacing:.22em;text-transform:uppercase">D2D Digital · Website Review</p><h1 style="margin:12px 0 5px;font-family:Georgia,serif;font-size:38px;line-height:1.05">${escapeHtml(String(session.company))}</h1><p style="margin:0;color:#d9e1de;font-size:14px">${escapeHtml(String(session.client_name))} · ${escapeHtml(String(session.client_email))}</p></header><main style="padding:30px"><p style="margin:0 0 24px;color:#52605c;font-size:15px;line-height:1.7">${recipient === "client" ? "Thank you for reviewing the site. This is your complete copy of the notes sent to D2D Digital." : "A complete client review is ready. Every saved page is organized below as its own change record."}</p><table role="presentation" style="width:100%;margin:0 0 28px;border-collapse:separate;border-spacing:8px"><tr><td style="width:33%;padding:16px;background:#fff;border:1px solid #ded4c9;border-radius:10px"><span style="display:block;color:#69736f;font-size:10px;text-transform:uppercase">Pages reviewed</span><strong style="display:block;margin-top:4px;font-family:Georgia,serif;font-size:25px">${pages.length}</strong></td><td style="width:33%;padding:16px;background:#fff;border:1px solid #ded4c9;border-radius:10px"><span style="display:block;color:#69736f;font-size:10px;text-transform:uppercase">Satisfaction</span><strong style="display:block;margin-top:4px;font-family:Georgia,serif;font-size:25px">${overall.satisfactionScore}/10</strong></td><td style="width:34%;padding:16px;background:#fff;border:1px solid #ded4c9;border-radius:10px"><span style="display:block;color:#69736f;font-size:10px;text-transform:uppercase">Status</span><strong style="display:block;margin-top:4px;font-size:14px;text-transform:capitalize">${escapeHtml(approvalLabel)}</strong></td></tr></table><section style="padding:24px;background:#fff;border:1px solid #ded4c9;border-radius:14px"><p style="margin:0 0 14px;color:#9a5f34;font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase">Pages included</p><table role="presentation" style="width:100%;border-collapse:collapse">${pageIndexHtml}</table></section><section style="margin:28px 0;padding:24px;background:#edf4f1;border:1px solid #cbded7;border-radius:14px"><p style="margin:0 0 14px;color:#0c7379;font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase">Overall perspective</p>${answersToHtml(overall.overallAnswers, overallQuestionLabels)}</section>${pageHtml}</main><footer style="padding:22px 30px;background:#18201d;color:#aebbb7;font-size:12px;line-height:1.6"><strong style="color:#7ee8ee">D2D Digital</strong><br />Collaborative website development · This report was generated from the saved client review.</footer></div></div>`;
  const resend = new Resend(apiKey);
  const recipients = [
    { email: ownerEmail.toLowerCase(), role: "owner" as const },
    ...(clientEmail === ownerEmail.toLowerCase() ? [] : [{ email: clientEmail, role: "client" as const }]),
  ];
  const delivery = await resend.batch.send(recipients.map((recipient) => ({
    from,
    to: recipient.email,
    replyTo: recipient.role === "owner" ? clientEmail : ownerEmail,
    subject: recipient.role === "owner" ? `Website Feedback: ${session.company} (${pages.length} ${pages.length === 1 ? "page" : "pages"})` : `Your website feedback copy: ${session.company}`,
    text: `${recipient.role === "client" ? "Thank you for reviewing the site. This is your copy of the feedback sent to D2D Digital.\n\n" : "A client website review is ready.\n\n"}${baseText}`,
    html: buildHtml(recipient.role),
  })));
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
