import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createPlatformDraft, schedulePost } from "@/lib/d2d-platform/shoutrrr";

type StoredMedia = { url: string; altText?: string };

type DeliveryItem = {
  id: string;
  platform: "facebook" | "instagram" | "linkedin";
  caption: string;
  media: StoredMedia[];
  scheduled_for: string;
  shoutrrr_post_id: string | null;
  current_revision: number;
  approved_revision: number | null;
};

async function audit(
  organizationId: string,
  actorId: string,
  action: string,
  subjectType: string,
  subjectId: string,
  detail: Record<string, unknown>,
) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("platform_audit_events").insert({
    organization_id: organizationId,
    actor_id: actorId,
    action,
    subject_type: subjectType,
    subject_id: subjectId,
    detail,
  });
  if (error) throw new Error(error.message);
}

/**
 * Delivers the exact version approved by a customer. The conditional status
 * claim prevents a second approval request or browser retry from duplicating
 * the batch. Existing D2D Social IDs are reused when an interrupted delivery
 * is retried by a platform administrator.
 */
export async function deliverApprovedBatch(batchId: string, actorId: string) {
  if (process.env.D2D_SOCIAL_SCHEDULING_ENABLED !== "true") {
    throw new Error("Production delivery is not enabled.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: batch, error: batchError } = await supabase
    .from("social_content_batches")
    .select("id,organization_id,status,approval_version,approved_approval_version")
    .eq("id", batchId)
    .single();
  if (batchError || !batch) throw new Error(batchError?.message ?? "Approved batch was not found.");
  if (batch.status === "scheduled") return { status: "scheduled" as const };
  if (!["approved", "failed"].includes(batch.status)
    || batch.approved_approval_version !== batch.approval_version) {
    throw new Error("The exact current batch has not been approved.");
  }

  const { data: claimed, error: claimError } = await supabase
    .from("social_content_batches")
    .update({ status: "scheduling", sync_error: null, updated_at: new Date().toISOString() })
    .eq("id", batch.id)
    .in("status", ["approved", "failed"])
    .eq("approval_version", batch.approval_version)
    .eq("approved_approval_version", batch.approval_version)
    .select("id")
    .maybeSingle();
  if (claimError) throw new Error(claimError.message);
  if (!claimed) {
    const { data: current } = await supabase.from("social_content_batches").select("status").eq("id", batch.id).single();
    if (current?.status === "scheduled" || current?.status === "scheduling") return { status: current.status as "scheduled" | "scheduling" };
    throw new Error("The approved batch could not be claimed for delivery.");
  }

  try {
    const { data, error: itemError } = await supabase
      .from("social_content_items")
      .select("id,platform,caption,media,scheduled_for,shoutrrr_post_id,current_revision,approved_revision")
      .eq("batch_id", batch.id)
      .order("scheduled_for")
      .order("platform");
    if (itemError) throw new Error(itemError.message);
    const items = (data ?? []) as DeliveryItem[];
    if (items.length === 0) throw new Error("An empty batch cannot be delivered.");

    for (const item of items) {
      if (item.approved_revision !== item.current_revision) throw new Error("A post changed after customer approval.");
      if (Date.parse(item.scheduled_for) <= Date.now()) throw new Error("A post's approved publish time has already passed.");

      let postId = item.shoutrrr_post_id;
      if (!postId) {
        postId = await createPlatformDraft({ platform: item.platform, caption: item.caption, media: item.media ?? [] });
        const { error: linkError } = await supabase
          .from("social_content_items")
          .update({ shoutrrr_post_id: postId, updated_at: new Date().toISOString() })
          .eq("id", item.id)
          .eq("current_revision", item.current_revision)
          .eq("approved_revision", item.current_revision);
        if (linkError) throw new Error(linkError.message);
        await audit(batch.organization_id, actorId, "social_item.draft_linked", "social_content_item", item.id, {
          shoutrrr_post_id: postId,
          source: "customer_approval",
        });
      }
    }

    const { data: linkedItems, error: linkedError } = await supabase
      .from("social_content_items")
      .select("id,scheduled_for,shoutrrr_post_id")
      .eq("batch_id", batch.id)
      .order("scheduled_for")
      .order("platform");
    if (linkedError) throw new Error(linkedError.message);
    for (const item of linkedItems ?? []) {
      if (!item.shoutrrr_post_id) throw new Error("A D2D Social draft is missing.");
      await schedulePost(item.shoutrrr_post_id, item.scheduled_for);
      await audit(batch.organization_id, actorId, "social_item.scheduled", "social_content_item", item.id, {
        shoutrrr_post_id: item.shoutrrr_post_id,
        scheduled_for: item.scheduled_for,
        source: "customer_approval",
      });
    }

    const { error: completedError } = await supabase
      .from("social_content_batches")
      .update({ status: "scheduled", sync_error: null, updated_at: new Date().toISOString() })
      .eq("id", batch.id)
      .eq("status", "scheduling");
    if (completedError) throw new Error(completedError.message);
    await audit(batch.organization_id, actorId, "social_batch.scheduled", "social_content_batch", batch.id, {
      approval_version: batch.approval_version,
      source: "customer_approval",
    });
    return { status: "scheduled" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 1000) : "Delivery failed.";
    await supabase.from("social_content_batches").update({
      status: "failed",
      sync_error: message,
      updated_at: new Date().toISOString(),
    }).eq("id", batch.id).eq("status", "scheduling");
    await audit(batch.organization_id, actorId, "social_batch.scheduling_failed", "social_content_batch", batch.id, {
      approval_version: batch.approval_version,
      error: message,
      source: "customer_approval",
    });
    throw error;
  }
}
