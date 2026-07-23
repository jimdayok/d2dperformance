import { ReviewQueueEntry } from "@/components/site-manager/review-queue-entry";
import { requireSiteAccess } from "@/lib/site-manager/access";
import { canPublish } from "@/lib/site-manager/permissions";
import { getSiteDefinition } from "@/lib/site-manager/registry";
import { createReviewDiff, type ReviewValue } from "@/lib/site-manager/review-diff";
import { editorGroups, modelKeyForEntry } from "@/lib/site-manager/sites/alford-custom-homes/editor-config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ReviewQueue({ params }: { params: Promise<{ siteSlug: string }> }) {
  const { siteSlug } = await params;
  const { site, access } = await requireSiteAccess(siteSlug);
  const definition = getSiteDefinition(siteSlug);
  const reviewerCanPublish = canPublish(access);
  const { data, error } = await (await createSupabaseServerClient())
    .from("content_entries")
    .select("id,title,content_type,content_key,draft_revision,draft_data,published_revision,published_data,updated_at")
    .eq("site_id", site.id)
    .eq("workflow_status", "in_review")
    .order("updated_at");

  const homepageLabels: Record<string, string> = {
    eyebrow: "Eyebrow", heading: "Heading", supportingCopy: "Supporting copy", image: "Hero image",
    "primaryCta.label": "Primary button label", "primaryCta.href": "Primary button path",
    "secondaryCta.label": "Secondary button label", "secondaryCta.href": "Secondary button path",
    trustCues: "Trust cues", "seo.title": "SEO title", "seo.description": "SEO description",
  };

  return (
    <div>
      <h1 className="font-display text-4xl font-semibold">Review Queue</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-black/55">Compare each submitted draft with the current published content. Preview the real site before approving and publishing.</p>
      {!reviewerCanPublish ? <p role="alert" className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Publisher permission is required to review this queue.</p> : null}
      {error ? <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">The review queue could not be loaded. Refresh the page or check Supabase connectivity.</p> : null}
      <div className="mt-8 grid gap-5">
        {reviewerCanPublish ? data?.map((entry) => {
          const modelKey = modelKeyForEntry(entry.content_type, entry.content_key);
          const model = modelKey ? definition?.models[modelKey] : null;
          if (!modelKey || !model) return null;
          const parsedDraft = model.schema.safeParse(entry.draft_data);
          if (!parsedDraft.success) return null;
          const rawPreviewPath = model.previewPath(parsedDraft.data);
          const [publishPath, hash = ""] = rawPreviewPath.split("#", 2);
          const labels = modelKey === "homepage-hero"
            ? homepageLabels
            : Object.fromEntries((editorGroups[modelKey] ?? []).flatMap((group) => group.fields.map((field) => [field.path, field.label])));
          const initialPublication = entry.published_revision === 0 || entry.published_data === null;
          const changes = createReviewDiff(entry.published_data as ReviewValue | undefined, entry.draft_data as ReviewValue | undefined, labels);
          return <ReviewQueueEntry
            key={entry.id}
            entryId={entry.id}
            title={entry.title}
            revision={entry.draft_revision}
            siteSlug={siteSlug}
            modelKey={modelKey}
            publishPath={publishPath || "/"}
            previewHash={hash ? `#${hash}` : ""}
            editorHref={`/portal/sites/${siteSlug}/content/${entry.content_type}/${entry.content_key}`}
            initialPublication={initialPublication}
            changes={changes}
          />;
        }) : null}
        {!error && reviewerCanPublish && !data?.length ? <p className="rounded-2xl border border-black/10 bg-white p-5 text-sm text-black/55">Nothing is awaiting review.</p> : null}
      </div>
    </div>
  );
}
