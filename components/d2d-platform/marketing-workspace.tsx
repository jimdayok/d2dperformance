"use client";
/* eslint-disable @next/next/no-img-element -- customer-approved image hosts are dynamic and validated server-side */

import { useActionState } from "react";
import { CalendarDays, CheckCircle2, ClipboardCheck, Megaphone, Sparkles } from "lucide-react";
import {
  createManualBatchAction,
  createMarketingPlanAction,
  createPromotionAction,
  generateBatchAction,
  reviewBatchAction,
  reviewPlanAction,
  reviseMarketingPlanAction,
  reviseSocialDayMediaAction,
  reviseSocialItemAction,
  retryApprovedDeliveryAction,
  submitBatchAction,
  submitPlanAction,
  type MarketingActionState,
} from "@/app/(portal)/portal/(authenticated)/marketing/actions";
import type { MarketingPlanContent } from "@/lib/d2d-platform/types";

type Access = { organizationId: string; organizationName: string; role: string };
type Plan = { id: string; title: string; period_start: string; period_end: string; status: string; current_revision: number; approved_revision: number | null; summary: string; plan: MarketingPlanContent };
type Promotion = { id: string; name: string; description: string; starts_at: string; ends_at: string; channels: string[]; priority: string; status: string };
type SocialItem = { id: string; batch_id: string; content_day: number; platform: string; caption: string; media: Array<{ url: string; altText?: string }>; creative_brief: string; scheduled_for: string; shoutrrr_post_id: string | null };
type Batch = { id: string; title: string; period_start: string; period_end: string; status: string; sync_error: string | null };

const initialState: MarketingActionState = {};

function formatDate(value: string) {
  const dateOnly = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function Feedback({ state }: { state: MarketingActionState }) {
  if (!state.error && !state.message) return null;
  return <p role={state.error ? "alert" : "status"} className={`mt-3 text-sm ${state.error ? "text-red-700" : "text-emerald-700"}`}>{state.error ?? state.message}</p>;
}

function centralDateTime(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function centralOffset(value: string) {
  const label = new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", timeZoneName: "short" }).format(new Date(value));
  return label.includes("CDT") ? "-05:00" : "-06:00";
}

function displayCentralDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
}

function SocialItemEditor({ item }: { item: SocialItem }) {
  const [state, action, pending] = useActionState(reviseSocialItemAction, initialState);
  return <details className="mt-4 rounded-xl border border-[#241c17]/10 bg-[#fffdf9] p-4">
    <summary className="cursor-pointer text-xs font-semibold text-[#7b4725]">Edit caption, image, or schedule</summary>
    <form action={action} className="mt-4 grid gap-3">
      <input type="hidden" name="itemId" value={item.id} />
      <label className="text-xs font-semibold text-[#4d443d]">Caption<textarea name="caption" required rows={7} defaultValue={item.caption} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d]">Image URLs <span className="font-normal text-[#877b70]">— one per line; optional: URL | alt text</span><textarea name="media" rows={3} defaultValue={item.media.map((media) => `${media.url}${media.altText ? ` | ${media.altText}` : ""}`).join("\n")} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" placeholder="https://approved-assets.example/image.png | Description" /></label>
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]"><label className="text-xs font-semibold text-[#4d443d]">Publish time<input name="scheduledFor" required type="datetime-local" defaultValue={centralDateTime(item.scheduled_for)} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label><label className="text-xs font-semibold text-[#4d443d]">Central time zone<select name="utcOffset" defaultValue={centralOffset(item.scheduled_for)} className="portal-field mt-2 w-full px-3 py-2.5 text-sm"><option value="-05:00">CDT (UTC−5)</option><option value="-06:00">CST (UTC−6)</option></select></label></div>
      <label className="text-xs font-semibold text-[#4d443d]">Creative brief<textarea name="creativeBrief" rows={3} defaultValue={item.creative_brief} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <div><button disabled={pending} className="portal-secondary-button px-3 py-2 text-sm font-semibold">{pending ? "Saving…" : "Save revision"}</button><Feedback state={state} /></div>
    </form>
  </details>;
}

function DayMediaEditor({ batchId, contentDay, media }: { batchId: string; contentDay: number; media: SocialItem["media"] }) {
  const [state, action, pending] = useActionState(reviseSocialDayMediaAction, initialState);
  return <details className="rounded-xl border border-[#241c17]/10 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-[#7b4725]">Day {contentDay}: apply images to Facebook, Instagram, and LinkedIn</summary><form action={action} className="mt-4"><input type="hidden" name="batchId" value={batchId} /><input type="hidden" name="contentDay" value={contentDay} /><label className="text-xs font-semibold text-[#4d443d]">Approved image URLs and alt text <span className="font-normal text-[#877b70]">— one per line: URL | description</span><textarea name="media" required rows={3} defaultValue={media.map((item) => `${item.url} | ${item.altText ?? ""}`).join("\n")} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" placeholder="https://approved-assets.example/day-1.png | Description of the image" /></label><button disabled={pending} className="portal-secondary-button mt-3 px-3 py-2 text-sm font-semibold">{pending ? "Applying…" : "Apply to all three platforms"}</button><Feedback state={state} /></form></details>;
}

function rows(values: string[]) {
  return values.join("\n");
}

function pipeValues(values: Array<Record<string, string>>, keys: string[]) {
  return values.map((value) => keys.map((key) => value[key]).join(" | ")).join("\n");
}

function PlanRevisionForm({ plan }: { plan: Plan }) {
  const [state, action, pending] = useActionState(reviseMarketingPlanAction, initialState);
  const content = plan.plan;
  return <details className="mt-4 rounded-xl border border-[#241c17]/10 bg-[#fffdf9] p-4"><summary className="cursor-pointer text-sm font-semibold text-[#7b4725]">Revise this plan</summary>
    <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="planId" value={plan.id} />
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Plan title<input required name="title" defaultValue={plan.title} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Executive summary<textarea required name="executiveSummary" rows={3} defaultValue={content.executiveSummary} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Revision summary<textarea name="summary" rows={2} defaultValue={plan.summary} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d]">Goals — one per line<textarea required name="goals" rows={4} defaultValue={rows(content.goals)} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d]">Audiences — one per line<textarea required name="audiences" rows={4} defaultValue={rows(content.audiences)} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Positioning<textarea required name="positioning" rows={3} defaultValue={content.positioning} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d]">Voice principles — one per line<textarea required name="voice" rows={4} defaultValue={rows(content.voice)} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d]">Success measures — one per line<textarea required name="measures" rows={4} defaultValue={rows(content.measures)} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Content pillars — name | purpose | frequency<textarea required name="contentPillars" rows={4} defaultValue={pipeValues(content.contentPillars, ["name", "purpose", "frequency"])} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Channels — platform | cadence | purpose<textarea required name="channels" rows={4} defaultValue={pipeValues(content.channels, ["platform", "cadence", "purpose"])} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d]">Seasonal priorities — one per line<textarea name="seasonalPriorities" rows={4} defaultValue={rows(content.seasonalPriorities)} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d]">Responsibilities — owner | responsibility<textarea required name="responsibilities" rows={4} defaultValue={pipeValues(content.responsibilities, ["owner", "responsibility"])} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <div className="sm:col-span-2"><button disabled={pending} className="portal-secondary-button px-3 py-2 text-sm font-semibold">{pending ? "Saving…" : "Save new revision"}</button><Feedback state={state} /></div>
    </form>
  </details>;
}

function PlanDetails({ plan }: { plan: Plan }) {
  const content = plan.plan;
  return <details className="mt-4 rounded-xl border border-[#241c17]/10 bg-[#f8f2e9] p-4"><summary className="cursor-pointer text-sm font-semibold">Review the complete current plan</summary><div className="mt-4 grid gap-5 text-sm leading-6 text-[#554c44] sm:grid-cols-2"><div className="sm:col-span-2"><h4 className="font-semibold text-[#302a25]">Executive summary</h4><p className="mt-1 whitespace-pre-wrap">{content.executiveSummary}</p></div><div><h4 className="font-semibold text-[#302a25]">Goals</h4><ul className="mt-1 list-disc pl-5">{content.goals.map((value) => <li key={value}>{value}</li>)}</ul></div><div><h4 className="font-semibold text-[#302a25]">Audiences</h4><ul className="mt-1 list-disc pl-5">{content.audiences.map((value) => <li key={value}>{value}</li>)}</ul></div><div className="sm:col-span-2"><h4 className="font-semibold text-[#302a25]">Positioning</h4><p className="mt-1 whitespace-pre-wrap">{content.positioning}</p></div><div><h4 className="font-semibold text-[#302a25]">Voice</h4><ul className="mt-1 list-disc pl-5">{content.voice.map((value) => <li key={value}>{value}</li>)}</ul></div><div><h4 className="font-semibold text-[#302a25]">Measures</h4><ul className="mt-1 list-disc pl-5">{content.measures.map((value) => <li key={value}>{value}</li>)}</ul></div><div className="sm:col-span-2"><h4 className="font-semibold text-[#302a25]">Content pillars</h4><div className="mt-1 grid gap-2">{content.contentPillars.map((pillar) => <p key={pillar.name}><strong>{pillar.name}:</strong> {pillar.purpose} ({pillar.frequency})</p>)}</div></div></div></details>;
}

function SectionHeading({ icon: Icon, eyebrow, title, children }: { icon: typeof CalendarDays; eyebrow: string; title: string; children: React.ReactNode }) {
  return <div className="flex items-start gap-4 border-b border-[#241c17]/10 pb-5">
    <span className="grid size-11 shrink-0 place-items-center border border-[#9a5f34]/20 bg-[#9a5f34]/8 text-[#9a5f34]"><Icon size={19} /></span>
    <div><p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9a5f34]">{eyebrow}</p><h2 className="mt-1 font-display text-3xl font-semibold">{title}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d6258]">{children}</p></div>
  </div>;
}

function PromotionForm({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState(createPromotionAction, initialState);
  return <form action={action} className="portal-panel mt-6 grid gap-4 p-5 sm:grid-cols-2">
    <input type="hidden" name="organizationId" value={organizationId} />
    <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Promotion or event name<input required name="name" className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
    <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">What customers need to know<textarea required name="description" rows={3} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
    <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Terms, exclusions, or required wording<textarea name="offerTerms" rows={2} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
    <label className="text-xs font-semibold text-[#4d443d]">Starts<input required name="startsOn" type="date" className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
    <label className="text-xs font-semibold text-[#4d443d]">Ends<input required name="endsOn" type="date" className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
    <label className="text-xs font-semibold text-[#4d443d]">Priority<select name="priority" defaultValue="normal" className="portal-field mt-2 w-full px-3 py-2.5 text-sm"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option><option value="low">Low</option></select></label>
    <fieldset className="text-xs font-semibold text-[#4d443d]"><legend>Channels</legend><div className="mt-3 flex flex-wrap gap-4">{["facebook", "instagram", "linkedin"].map((channel) => <label key={channel} className="flex items-center gap-2 capitalize"><input type="checkbox" name={channel} defaultChecked />{channel}</label>)}</div></fieldset>
    <div className="sm:col-span-2"><button disabled={pending} className="portal-primary-button px-4 py-2.5 text-sm font-semibold">{pending ? "Submitting…" : "Submit promotion"}</button><Feedback state={state} /></div>
  </form>;
}

function PlanForm({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState(createMarketingPlanAction, initialState);
  return <details className="portal-panel mt-6 p-5"><summary className="cursor-pointer font-semibold text-[#302a25]">Create a marketing plan</summary>
    <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Plan title<input required name="title" className="portal-field mt-2 w-full px-3 py-2.5 text-sm" placeholder="2026 marketing plan" /></label>
      <label className="text-xs font-semibold text-[#4d443d]">Start date<input required name="periodStart" type="date" className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d]">End date<input required name="periodEnd" type="date" className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Executive summary<textarea required name="executiveSummary" rows={3} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Internal summary<textarea name="summary" rows={2} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d]">Goals <span className="font-normal text-[#877b70]">— one per line</span><textarea required name="goals" rows={4} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d]">Audiences <span className="font-normal text-[#877b70]">— one per line</span><textarea required name="audiences" rows={4} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Positioning<textarea required name="positioning" rows={3} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d]">Voice principles <span className="font-normal text-[#877b70]">— one per line</span><textarea required name="voice" rows={4} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d]">Success measures <span className="font-normal text-[#877b70]">— one per line</span><textarea required name="measures" rows={4} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Content pillars <span className="font-normal text-[#877b70]">— name | purpose | frequency</span><textarea required name="contentPillars" rows={4} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Channels <span className="font-normal text-[#877b70]">— platform | cadence | purpose</span><textarea required name="channels" rows={4} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" defaultValue={"Facebook | 3 times weekly | Community reach\nInstagram | 3 times weekly | Visual storytelling\nLinkedIn | 2 times weekly | Professional credibility"} /></label>
      <label className="text-xs font-semibold text-[#4d443d]">Seasonal priorities <span className="font-normal text-[#877b70]">— one per line</span><textarea name="seasonalPriorities" rows={4} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d]">Responsibilities <span className="font-normal text-[#877b70]">— owner | responsibility</span><textarea required name="responsibilities" rows={4} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <div className="sm:col-span-2"><button disabled={pending} className="portal-primary-button px-4 py-2.5 text-sm font-semibold">{pending ? "Saving…" : "Save plan draft"}</button><Feedback state={state} /></div>
    </form>
  </details>;
}

function BatchGenerator({ organizationId, plans }: { organizationId: string; plans: Plan[] }) {
  const [state, action, pending] = useActionState(generateBatchAction, initialState);
  const approved = plans.filter((plan) => plan.status === "approved" && plan.approved_revision === plan.current_revision);
  if (approved.length === 0) return <p className="portal-panel mt-6 p-5 text-sm text-[#6d6258]">Approve a current marketing plan before generating social content.</p>;
  return <form action={action} className="portal-panel mt-6 grid gap-4 p-5 sm:grid-cols-2">
    <input type="hidden" name="organizationId" value={organizationId} />
    <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Approved plan<select required name="marketingPlanId" className="portal-field mt-2 w-full px-3 py-2.5 text-sm">{approved.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</select></label>
    <label className="text-xs font-semibold text-[#4d443d]">Week starts<input required name="periodStart" type="date" className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
    <label className="text-xs font-semibold text-[#4d443d]">Week ends<input required name="periodEnd" type="date" className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
    <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Special instructions<textarea name="instructions" rows={3} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" placeholder="Optional campaign focus or approved creative direction" /></label>
    <div className="sm:col-span-2"><button disabled={pending} className="portal-primary-button inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"><Sparkles size={15} />{pending ? "Drafting…" : "Generate reviewable drafts"}</button><Feedback state={state} /></div>
  </form>;
}

function ManualPostComposer({ organizationId, plans }: { organizationId: string; plans: Plan[] }) {
  const [state, action, pending] = useActionState(createManualBatchAction, initialState);
  const approved = plans.filter((plan) => plan.status === "approved" && plan.approved_revision === plan.current_revision);
  if (approved.length === 0) return null;
  return <details className="portal-panel mt-6 p-5" open>
    <summary className="cursor-pointer font-semibold text-[#302a25]">Create one post for customer approval</summary>
    <p className="mt-3 text-sm leading-6 text-[#6d6258]">Add only the platforms that should publish. The customer will see the exact captions, image, and publish time before approving.</p>
    <form action={action} className="mt-5 grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="organizationId" value={organizationId} />
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Approved plan<select required name="marketingPlanId" className="portal-field mt-2 w-full px-3 py-2.5 text-sm">{approved.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</select></label>
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Approval batch title<input required name="title" className="portal-field mt-2 w-full px-3 py-2.5 text-sm" placeholder="Client approval proof — September 2026" /></label>
      <label className="text-xs font-semibold text-[#4d443d]">Publish time<input required name="scheduledFor" type="datetime-local" className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d]">Central time zone<select name="utcOffset" defaultValue="-05:00" className="portal-field mt-2 w-full px-3 py-2.5 text-sm"><option value="-05:00">CDT (UTC−5)</option><option value="-06:00">CST (UTC−6)</option></select></label>
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Facebook caption <span className="font-normal text-[#877b70]">— leave blank to skip Facebook</span><textarea name="facebookCaption" rows={6} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Instagram caption <span className="font-normal text-[#877b70]">— leave blank to skip Instagram</span><textarea name="instagramCaption" rows={6} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">LinkedIn caption <span className="font-normal text-[#877b70]">— leave blank until the D2D Marketing Page is connected</span><textarea name="linkedinCaption" rows={6} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label>
      <label className="text-xs font-semibold text-[#4d443d] sm:col-span-2">Approved image URLs and alt text <span className="font-normal text-[#877b70]">— one per line: URL | description</span><textarea name="media" rows={3} className="portal-field mt-2 w-full px-3 py-2.5 text-sm" placeholder="https://approved-host.example/post.png | Description of the image" /></label>
      <div className="sm:col-span-2"><button disabled={pending} className="portal-primary-button px-4 py-2.5 text-sm font-semibold">{pending ? "Saving…" : "Create reviewable post"}</button><Feedback state={state} /></div>
    </form>
  </details>;
}

export function MarketingWorkspace({ access, plans, promotions, batches, items, schedulingEnabled }: { access: Access; plans: Plan[]; promotions: Promotion[]; batches: Batch[]; items: SocialItem[]; schedulingEnabled: boolean }) {
  const canCreate = ["platform_admin", "manager", "creator"].includes(access.role);
  const canReview = ["platform_admin", "manager", "reviewer"].includes(access.role);
  const isPlatformAdmin = access.role === "platform_admin";
  return <div className="space-y-12">
    <header className="border-b border-[#241c17]/12 pb-7"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9a5f34]">{access.organizationName}</p><h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Marketing workspace</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-[#6d6258]">One agreed plan, one place for sales and specials, and an exact approval record before anything is scheduled.</p></header>

    <section id="plan"><SectionHeading icon={ClipboardCheck} eyebrow="Shared direction" title="Marketing plan">Every campaign is grounded in the customer-approved current version. Editing an approved version requires a new review.</SectionHeading>
      <div className="mt-6 grid gap-4">{plans.map((plan) => <article key={plan.id} className="portal-panel p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-2xl font-semibold">{plan.title}</h3><p className="mt-1 text-sm text-[#6d6258]">{formatDate(plan.period_start)}–{formatDate(plan.period_end)} · Revision {plan.current_revision}</p></div><span className="rounded-full bg-[#9a5f34]/10 px-3 py-1 text-xs font-semibold capitalize text-[#7b4725]">{statusLabel(plan.status)}</span></div>
        <PlanDetails plan={plan} />
        {canCreate && ["draft", "changes_requested"].includes(plan.status) ? <><PlanRevisionForm plan={plan} /><form action={submitPlanAction} className="mt-4"><input type="hidden" name="planId" value={plan.id} /><button className="portal-secondary-button px-3 py-2 text-sm font-semibold">Submit for customer review</button></form></> : null}
        {canReview && plan.status === "in_review" ? <form action={reviewPlanAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"><input type="hidden" name="planId" value={plan.id} /><input name="note" className="portal-field px-3 py-2 text-sm" placeholder="Optional review note" /><button name="decision" value="changes_requested" className="portal-secondary-button px-3 py-2 text-sm font-semibold">Request changes</button><button name="decision" value="approved" className="portal-primary-button px-3 py-2 text-sm font-semibold">Approve plan</button></form> : null}
      </article>)}</div>
      {plans.length === 0 ? <p className="portal-panel mt-6 p-5 text-sm text-[#6d6258]">No marketing plan has been created yet.</p> : null}
      {canCreate ? <PlanForm organizationId={access.organizationId} /> : null}
    </section>

    <section id="promotions"><SectionHeading icon={Megaphone} eyebrow="Customer input" title="Sales, specials, and events">Submit real dates and approved offer language before content is drafted. Nothing here publishes automatically.</SectionHeading>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">{promotions.map((promotion) => <article key={promotion.id} className="portal-panel p-5"><div className="flex justify-between gap-3"><h3 className="font-display text-xl font-semibold">{promotion.name}</h3><span className="text-xs font-semibold capitalize text-[#9a5f34]">{promotion.priority}</span></div><p className="mt-3 text-sm leading-6 text-[#62584f]">{promotion.description}</p><p className="mt-4 text-xs text-[#7a6f65]">{formatDate(promotion.starts_at)}–{formatDate(promotion.ends_at)} · {promotion.channels.join(", ")}</p></article>)}</div>
      {canReview ? <PromotionForm organizationId={access.organizationId} /> : null}
    </section>

    <section id="content"><SectionHeading icon={CheckCircle2} eyebrow="Approval gate" title="Social content">Platform-specific captions and imagery remain drafts until the customer approves the exact current batch. Approval automatically creates and schedules the posts in D2D Social.</SectionHeading>
      <div className="mt-6 grid gap-6">{batches.map((batch) => { const batchItems = items.filter((item) => item.batch_id === batch.id); return <article key={batch.id} className="portal-panel overflow-hidden"><div className="border-b border-[#241c17]/10 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-2xl font-semibold">{batch.title}</h3><p className="mt-1 text-sm text-[#6d6258]">{formatDate(batch.period_start)}–{formatDate(batch.period_end)} · {batchItems.length} platform posts</p></div><span className="rounded-full bg-[#9a5f34]/10 px-3 py-1 text-xs font-semibold capitalize text-[#7b4725]">{statusLabel(batch.status)}</span></div>{batch.sync_error && isPlatformAdmin ? <p role="alert" className="mt-3 text-sm text-red-700">{batch.sync_error}</p> : null}{batch.status === "failed" && !isPlatformAdmin ? <p className="mt-3 text-sm text-[#6d6258]">Your approval is saved. D2D is resolving the delivery connection; you do not need to approve again.</p> : null}</div>
        {canCreate && ["internal_review", "changes_requested"].includes(batch.status) ? <div className="grid gap-3 border-b border-[#241c17]/10 bg-[#f8f2e9] p-5">{[...new Set(batchItems.map((item) => item.content_day))].map((contentDay) => <DayMediaEditor key={contentDay} batchId={batch.id} contentDay={contentDay} media={batchItems.find((item) => item.content_day === contentDay)?.media ?? []} />)}</div> : null}
        <div className="divide-y divide-[#241c17]/10">{batchItems.map((item) => <div key={item.id} className="grid gap-3 p-5 sm:grid-cols-[8rem_1fr]"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9a5f34]">Day {item.content_day}</p><p className="mt-1 text-sm font-semibold capitalize">{item.platform}</p><p className="mt-1 text-xs text-[#7a6f65]">{displayCentralDateTime(item.scheduled_for)}</p></div><div>{item.media.length > 0 ? <div className="mb-4 flex flex-wrap gap-3">{item.media.map((media) => <img key={media.url} src={media.url} alt={media.altText ?? `${item.platform} post image`} loading="lazy" className="h-32 w-32 rounded-xl border border-black/10 bg-white object-cover" />)}</div> : null}<p className="whitespace-pre-wrap text-sm leading-6 text-[#403933]">{item.caption}</p><p className="mt-3 text-xs text-[#7a6f65]">{item.media.length > 0 ? `${item.media.length} approved image${item.media.length === 1 ? "" : "s"}` : `Creative needed: ${item.creative_brief}`}</p>{item.shoutrrr_post_id ? <p className="mt-1 text-xs font-semibold text-emerald-700">D2D Social draft created</p> : null}{canCreate && ["internal_review", "changes_requested"].includes(batch.status) ? <SocialItemEditor item={item} /> : null}</div></div>)}</div>
        <div className="flex flex-wrap gap-3 border-t border-[#241c17]/10 bg-[#f8f2e9] p-5">
          {canCreate && ["internal_review", "changes_requested"].includes(batch.status) ? <form action={submitBatchAction}><input type="hidden" name="batchId" value={batch.id} /><button className="portal-secondary-button px-3 py-2 text-sm font-semibold">Send to customer for approval</button></form> : null}
          {canReview && batch.status === "client_review" ? <form action={reviewBatchAction} className="flex flex-wrap gap-2"><input type="hidden" name="batchId" value={batch.id} /><input name="note" className="portal-field px-3 py-2 text-sm" placeholder="Optional review note" /><button name="decision" value="changes_requested" className="portal-secondary-button px-3 py-2 text-sm font-semibold">Request changes</button><button name="decision" value="approved" className="portal-primary-button px-3 py-2 text-sm font-semibold">Approve exact batch</button></form> : null}
          {batch.status === "scheduling" ? <p className="text-sm font-semibold text-[#7b4725]">Approved — sending to D2D Social…</p> : null}
          {batch.status === "scheduled" ? <p className="text-sm font-semibold text-emerald-700">Customer approved · D2D Social scheduled automatically</p> : null}
          {isPlatformAdmin && ["approved", "failed"].includes(batch.status) ? <form action={retryApprovedDeliveryAction}><input type="hidden" name="batchId" value={batch.id} /><button disabled={!schedulingEnabled} title={schedulingEnabled ? undefined : "Production scheduling is disabled"} className="portal-primary-button px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50">Retry approved delivery</button></form> : null}
        </div>
      </article>; })}</div>
      {batches.length === 0 ? <p className="portal-panel mt-6 p-5 text-sm text-[#6d6258]">No social content batches have been created.</p> : null}
      {canCreate ? <ManualPostComposer organizationId={access.organizationId} plans={plans} /> : null}
      {canCreate ? <BatchGenerator organizationId={access.organizationId} plans={plans} /> : null}
    </section>
  </div>;
}
