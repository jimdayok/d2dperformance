"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/site-manager/access";
import { requireProductAccess } from "@/lib/d2d-platform/access";
import {
  generateSocialBatchSchema,
  manualSocialBatchSchema,
  marketingPlanContentSchema,
  marketingPlanDraftSchema,
  promotionSchema,
  reviseSocialItemSchema,
  reviewSchema,
} from "@/lib/d2d-platform/schemas";
import { generateSocialBatch } from "@/lib/d2d-platform/openai";
import { createPlatformDraft, schedulePost } from "@/lib/d2d-platform/shoutrrr";
import { deliverApprovedBatch } from "@/lib/d2d-platform/deliver-approved-batch";
import type { MarketingPlanContent } from "@/lib/d2d-platform/types";
import { z } from "zod";

export type MarketingActionState = { error?: string; message?: string };
const initialFailure = (error: unknown): MarketingActionState => ({
  error: error instanceof Error ? error.message : "The request could not be completed.",
});

function lines(value: FormDataEntryValue | null) {
  return String(value ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
}

function pipeRows(value: FormDataEntryValue | null, columns: number) {
  return lines(value).map((row) => {
    const values = row.split("|").map((item) => item.trim());
    while (values.length < columns) values.push("");
    return values;
  });
}

function dateAtNoonUtc(value: FormDataEntryValue | null) {
  return `${String(value ?? "")}T12:00:00.000Z`;
}

function selectedChannels(formData: FormData) {
  return ["facebook", "instagram", "linkedin"].filter((name) => formData.get(name) === "on");
}

const idSchema = z.string().uuid();

async function requireSignedIn() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in again to continue.");
  return user;
}

function planContentFromForm(formData: FormData): MarketingPlanContent {
  return {
    executiveSummary: String(formData.get("executiveSummary") ?? ""),
    goals: lines(formData.get("goals")),
    audiences: lines(formData.get("audiences")),
    positioning: String(formData.get("positioning") ?? ""),
    voice: lines(formData.get("voice")),
    contentPillars: pipeRows(formData.get("contentPillars"), 3).map(([name, purpose, frequency]) => ({ name, purpose, frequency })),
    channels: pipeRows(formData.get("channels"), 3).map(([platform, cadence, purpose]) => ({ platform, cadence, purpose })),
    seasonalPriorities: lines(formData.get("seasonalPriorities")),
    measures: lines(formData.get("measures")),
    responsibilities: pipeRows(formData.get("responsibilities"), 2).map(([owner, responsibility]) => ({ owner, responsibility })),
  };
}

export async function createPromotionAction(
  _: MarketingActionState,
  formData: FormData,
): Promise<MarketingActionState> {
  try {
    const parsed = promotionSchema.parse({
      organizationId: formData.get("organizationId"),
      name: formData.get("name"),
      description: formData.get("description"),
      offerTerms: formData.get("offerTerms") ?? "",
      startsAt: dateAtNoonUtc(formData.get("startsOn")),
      endsAt: dateAtNoonUtc(formData.get("endsOn")),
      priority: formData.get("priority") ?? "normal",
      channels: selectedChannels(formData),
    });
    await requireProductAccess(parsed.organizationId, "social", ["manager", "creator", "reviewer"]);
    const user = await getCurrentUser();
    if (!user) throw new Error("Sign in again to continue.");
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("promotions").insert({
      organization_id: parsed.organizationId,
      name: parsed.name,
      description: parsed.description,
      offer_terms: parsed.offerTerms,
      starts_at: parsed.startsAt,
      ends_at: parsed.endsAt,
      priority: parsed.priority,
      channels: parsed.channels,
      submitted_by: user.id,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/portal/marketing");
    return { message: "Promotion submitted to the marketing calendar." };
  } catch (error) {
    return initialFailure(error);
  }
}

export async function createMarketingPlanAction(
  _: MarketingActionState,
  formData: FormData,
): Promise<MarketingActionState> {
  try {
    const content = planContentFromForm(formData);
    const parsed = marketingPlanDraftSchema.parse({
      organizationId: formData.get("organizationId"),
      title: formData.get("title"),
      periodStart: formData.get("periodStart"),
      periodEnd: formData.get("periodEnd"),
      summary: formData.get("summary") ?? "",
      plan: content,
    });
    await requireProductAccess(parsed.organizationId, "social", ["manager", "creator"]);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("create_marketing_plan_draft", {
      check_organization: parsed.organizationId,
      check_title: parsed.title,
      check_period_start: parsed.periodStart,
      check_period_end: parsed.periodEnd,
      check_summary: parsed.summary,
      check_plan: parsed.plan,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/portal/marketing");
    return { message: "Marketing plan saved as a draft." };
  } catch (error) {
    return initialFailure(error);
  }
}

export async function submitPlanAction(formData: FormData) {
  await requireSignedIn();
  const planId = idSchema.parse(formData.get("planId"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("submit_marketing_plan_for_review", { check_plan: planId });
  if (error) throw new Error(error.message);
  revalidatePath("/portal/marketing");
}

export async function reviewPlanAction(formData: FormData) {
  await requireSignedIn();
  const parsed = reviewSchema.parse({
    subjectId: formData.get("planId"),
    decision: formData.get("decision"),
    note: formData.get("note") ?? "",
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("review_marketing_plan", {
    check_plan: parsed.subjectId,
    check_decision: parsed.decision,
    check_note: parsed.note,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/portal/marketing");
}

export async function reviseMarketingPlanAction(
  _: MarketingActionState,
  formData: FormData,
): Promise<MarketingActionState> {
  try {
    await requireSignedIn();
    const content = planContentFromForm(formData);
    const validatedContent = marketingPlanContentSchema.parse(content);
    const planId = idSchema.parse(formData.get("planId"));
    const title = z.string().trim().min(1).max(180).parse(formData.get("title"));
    const summary = z.string().trim().max(3000).parse(formData.get("summary") ?? "");
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("revise_marketing_plan", {
      check_plan: planId,
      check_title: title,
      check_summary: summary,
      check_content: validatedContent,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/portal/marketing");
    return { message: "A new plan revision was saved. It must be submitted and approved again." };
  } catch (error) {
    return initialFailure(error);
  }
}

export async function generateBatchAction(
  _: MarketingActionState,
  formData: FormData,
): Promise<MarketingActionState> {
  try {
    const parsed = generateSocialBatchSchema.parse({
      organizationId: formData.get("organizationId"),
      marketingPlanId: formData.get("marketingPlanId"),
      periodStart: formData.get("periodStart"),
      periodEnd: formData.get("periodEnd"),
      instructions: formData.get("instructions") ?? "",
    });
    const access = await requireProductAccess(parsed.organizationId, "social", ["manager", "creator"]);
    const supabase = await createSupabaseServerClient();
    const [{ data: plan }, { data: version }, { data: promotions }] = await Promise.all([
      supabase.from("marketing_plans").select("id,status,current_revision,approved_revision")
        .eq("id", parsed.marketingPlanId).eq("organization_id", parsed.organizationId).single(),
      supabase.from("marketing_plan_versions").select("plan,revision")
        .eq("marketing_plan_id", parsed.marketingPlanId).order("revision", { ascending: false }).limit(1).single(),
      supabase.from("promotions").select("name,description,offer_terms,starts_at,ends_at,channels")
        .eq("organization_id", parsed.organizationId)
        .lte("starts_at", `${parsed.periodEnd}T23:59:59.999Z`)
        .gte("ends_at", `${parsed.periodStart}T00:00:00.000Z`)
        .neq("status", "cancelled"),
    ]);
    if (!plan || plan.status !== "approved" || plan.approved_revision !== plan.current_revision) {
      throw new Error("Approve the current marketing plan before generating campaign content.");
    }
    if (!version || version.revision !== plan.current_revision) throw new Error("The approved marketing plan version is unavailable.");
    const generated = await generateSocialBatch({
      organizationName: access.organizationName,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
      plan: version.plan as MarketingPlanContent,
      promotions: promotions ?? [],
      instructions: parsed.instructions,
    });
    const periodStart = Date.parse(`${parsed.periodStart}T00:00:00.000Z`);
    const periodEnd = Date.parse(`${parsed.periodEnd}T23:59:59.999Z`);
    if (generated.items.some((item) => {
      const scheduled = Date.parse(item.scheduledFor);
      return scheduled < periodStart || scheduled > periodEnd;
    })) throw new Error("The generated schedule fell outside the requested period.");
    const { error } = await supabase.rpc("create_social_batch_from_json", {
      check_organization: parsed.organizationId,
      check_marketing_plan: parsed.marketingPlanId,
      check_title: generated.title,
      check_period_start: parsed.periodStart,
      check_period_end: parsed.periodEnd,
      check_items: generated.items,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/portal/marketing");
    return { message: "A platform-specific content batch was created for internal review." };
  } catch (error) {
    return initialFailure(error);
  }
}

export async function createManualBatchAction(
  _: MarketingActionState,
  formData: FormData,
): Promise<MarketingActionState> {
  try {
    const localDateTime = String(formData.get("scheduledFor") ?? "");
    const utcOffset = z.enum(["-05:00", "-06:00"]).parse(formData.get("utcOffset"));
    const media = lines(formData.get("media")).map((row) => {
      const [url, ...altParts] = row.split("|");
      return { url: url.trim(), altText: altParts.join("|").trim() };
    });
    const parsed = manualSocialBatchSchema.parse({
      organizationId: formData.get("organizationId"),
      marketingPlanId: formData.get("marketingPlanId"),
      title: formData.get("title"),
      scheduledFor: new Date(`${localDateTime}:00${utcOffset}`).toISOString(),
      captions: {
        facebook: String(formData.get("facebookCaption") ?? "").trim() || undefined,
        instagram: String(formData.get("instagramCaption") ?? "").trim() || undefined,
        linkedin: String(formData.get("linkedinCaption") ?? "").trim() || undefined,
      },
      media,
    });
    await requireProductAccess(parsed.organizationId, "social", ["manager", "creator"]);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("create_manual_social_batch", {
      check_organization: parsed.organizationId,
      check_marketing_plan: parsed.marketingPlanId,
      check_title: parsed.title,
      check_scheduled_for: parsed.scheduledFor,
      check_captions: parsed.captions,
      check_media: parsed.media,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/portal/marketing");
    return { message: "The post is ready for D2D review. Send it to the customer when the exact copy and image are final." };
  } catch (error) {
    return initialFailure(error);
  }
}

export async function submitBatchAction(formData: FormData) {
  await requireSignedIn();
  const batchId = idSchema.parse(formData.get("batchId"));
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("submit_social_batch_for_client_review", { check_batch: batchId });
  if (error) throw new Error(error.message);
  revalidatePath("/portal/marketing");
}

export async function reviewBatchAction(formData: FormData) {
  const user = await requireSignedIn();
  const parsed = reviewSchema.parse({
    subjectId: formData.get("batchId"),
    decision: formData.get("decision"),
    note: formData.get("note") ?? "",
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("review_social_batch", {
    check_batch: parsed.subjectId,
    check_decision: parsed.decision,
    check_note: parsed.note,
  });
  if (error) throw new Error(error.message);
  if (parsed.decision === "approved") {
    try {
      await deliverApprovedBatch(parsed.subjectId, user.id);
    } catch {
      // The approval record is authoritative. Delivery failures are persisted on
      // the batch for D2D to resolve without asking the customer to approve twice.
    }
  }
  revalidatePath("/portal/marketing");
}

export async function retryApprovedDeliveryAction(formData: FormData) {
  const user = await requireSignedIn();
  const batchId = idSchema.parse(formData.get("batchId"));
  const supabase = await createSupabaseServerClient();
  const { data: batch } = await supabase.from("social_content_batches")
    .select("organization_id").eq("id", batchId).single();
  if (!batch) throw new Error("Approved batch was not found.");
  const access = await requireProductAccess(batch.organization_id, "social", ["manager"]);
  if (access.role !== "platform_admin") throw new Error("A D2D platform administrator must retry delivery.");
  await deliverApprovedBatch(batchId, user.id);
  revalidatePath("/portal/marketing");
}

export async function reviseSocialItemAction(
  _: MarketingActionState,
  formData: FormData,
): Promise<MarketingActionState> {
  try {
    await requireSignedIn();
    const media = lines(formData.get("media")).map((row) => {
      const [url, ...altParts] = row.split("|");
      const altText = altParts.join("|").trim();
      return { url: url.trim(), ...(altText ? { altText } : {}) };
    });
    const localDateTime = String(formData.get("scheduledFor") ?? "");
    const utcOffset = z.enum(["-05:00", "-06:00"]).parse(formData.get("utcOffset"));
    const parsed = reviseSocialItemSchema.parse({
      itemId: formData.get("itemId"),
      caption: formData.get("caption"),
      media,
      scheduledFor: new Date(`${localDateTime}:00${utcOffset}`).toISOString(),
      creativeBrief: formData.get("creativeBrief") ?? "",
    });
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("revise_social_content_item", {
      check_item: parsed.itemId,
      check_caption: parsed.caption,
      check_media: parsed.media,
      check_scheduled_for: parsed.scheduledFor,
      check_creative_brief: parsed.creativeBrief,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/portal/marketing");
    return { message: "The post was revised. Any prior approval has been cleared." };
  } catch (error) {
    return initialFailure(error);
  }
}

export async function reviseSocialDayMediaAction(
  _: MarketingActionState,
  formData: FormData,
): Promise<MarketingActionState> {
  try {
    await requireSignedIn();
    const batchId = idSchema.parse(formData.get("batchId"));
    const contentDay = z.coerce.number().int().positive().parse(formData.get("contentDay"));
    const media = z.array(z.object({
      url: z.string().url().refine((value) => value.startsWith("https://"), "Image URLs must use HTTPS."),
      altText: z.string().trim().min(1).max(500),
    })).min(1).max(10).parse(lines(formData.get("media")).map((row) => {
      const [url, ...altParts] = row.split("|");
      return { url: url.trim(), altText: altParts.join("|").trim() };
    }));
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("revise_social_content_day_media", {
      check_batch: batchId,
      check_content_day: contentDay,
      check_media: media,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/portal/marketing");
    return { message: `The approved image was applied to all three Day ${contentDay} posts.` };
  } catch (error) {
    return initialFailure(error);
  }
}

type StoredMedia = { url: string; altText?: string };
type SocialItemRow = {
  id: string;
  platform: "facebook" | "instagram" | "linkedin";
  caption: string;
  media: StoredMedia[];
  shoutrrr_post_id: string | null;
};

export async function createApprovedDraftsAction(formData: FormData) {
  await requireSignedIn();
  const batchId = idSchema.parse(formData.get("batchId"));
  const supabase = await createSupabaseServerClient();
  const { data: batch } = await supabase.from("social_content_batches")
    .select("id,organization_id,status,approval_version,approved_approval_version")
    .eq("id", batchId).single();
  if (!batch || batch.status !== "approved" || batch.approval_version !== batch.approved_approval_version) {
    throw new Error("The exact current content batch must be approved first.");
  }
  const access = await requireProductAccess(batch.organization_id, "social", ["manager"]);
  if (access.role !== "platform_admin") throw new Error("A D2D platform administrator must create publishing drafts.");
  const { data: items } = await supabase.from("social_content_items")
    .select("id,platform,caption,media,shoutrrr_post_id,current_revision,approved_revision")
    .eq("batch_id", batchId).order("scheduled_for");
  for (const row of items ?? []) {
    if (row.current_revision !== row.approved_revision) throw new Error("A post changed after approval.");
    if (row.shoutrrr_post_id) continue;
    const item = row as SocialItemRow & { current_revision: number; approved_revision: number };
    const postId = await createPlatformDraft({ platform: item.platform, caption: item.caption, media: item.media ?? [] });
    const { error } = await supabase.rpc("record_social_item_shoutrrr_post", {
      check_item: item.id,
      check_post_id: postId,
    });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/portal/marketing");
}

export async function scheduleApprovedBatchAction(formData: FormData) {
  await requireSignedIn();
  if (process.env.D2D_SOCIAL_SCHEDULING_ENABLED !== "true") {
    throw new Error("Scheduling remains disabled until the production approval gate is opened.");
  }
  const batchId = idSchema.parse(formData.get("batchId"));
  const supabase = await createSupabaseServerClient();
  const { data: claimed, error: claimError } = await supabase.rpc("claim_social_batch_for_scheduling", { check_batch: batchId });
  if (claimError) throw new Error(claimError.message);
  try {
    for (const item of claimed ?? []) {
      if (!item.shoutrrr_post_id) throw new Error("Create every D2D Social draft before scheduling.");
      await schedulePost(item.shoutrrr_post_id, item.scheduled_for);
    }
    const { error } = await supabase.rpc("complete_social_batch_scheduling", {
      check_batch: batchId,
      check_succeeded: true,
      check_error: null,
    });
    if (error) throw new Error(error.message);
  } catch (error) {
    await supabase.rpc("complete_social_batch_scheduling", {
      check_batch: batchId,
      check_succeeded: false,
      check_error: error instanceof Error ? error.message.slice(0, 1000) : "Scheduling failed.",
    });
    throw error;
  }
  revalidatePath("/portal/marketing");
}
