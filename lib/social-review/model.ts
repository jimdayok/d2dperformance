export const reviewStatuses = ["idea", "in_progress", "pending", "changes_requested", "approved", "scheduled"] as const;
export type ReviewStatus = typeof reviewStatuses[number];
export type ReviewPost = {
 id: string; organization_id: string; title: string; project: string; status: ReviewStatus;
 revision: number; lock_version: number; approved_revision: number | null; planned_for: string | null; is_test: boolean;
 source_draft_id: string | null; updated_at: string;
 content: { captions: Record<string,string>; mediaIds: string[]; kind: string; tags: string[]; brief: string; campaign?:string;contentType?:"evergreen"|"campaign";productFocus?:string;sampleImage?: string; sampleImages?: string[] };
 media: {url:string; type:string; alt:string}[];
};
export type ReviewActivity = {id:string;post_id:string;kind:string;body:string;actor_name:string;created_at:string};
export function assertStagingReview(env: Record<string,string|undefined>) {
 if (env.D2D_SOCIAL_REVIEW_STAGING !== "true" || env.D2D_SOCIAL_SCHEDULING_ENABLED === "true" ||
 !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(env.SUPABASE_SERVER_URL || "")) {
  throw Error("This workspace is available only in isolated private staging with live delivery disabled.");
 }
}
export function canTransition(post: Pick<ReviewPost,"status"|"revision"|"approved_revision"|"planned_for"|"is_test">, action: string, now = Date.now()) {
 if (["approve","schedule","reschedule"].includes(action) && !post.is_test) throw Error("Real post approvals and scheduling are blocked in this staging review.");
 if (action === "approve" && post.status !== "pending") throw Error("Submit this post for review first.");
 if (action === "schedule" && (post.status !== "approved" || post.approved_revision !== post.revision)) throw Error("Approve the current version of this post first.");
 if (action === "schedule" && (!post.planned_for || Date.parse(post.planned_for) <= now)) throw Error("Choose a future time before scheduling.");
 if (["edit","submit","request_changes"].includes(action) && post.status === "scheduled") throw Error("A scheduled test post is locked. Return it to a draft first.");
}
export function centralDay(value: string) {
 return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Chicago",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(value));
}

export function reviewIsLive(env:Record<string,string|undefined>){return env.D2D_SOCIAL_REVIEW_STAGING!=="true"&&env.D2D_SOCIAL_REVIEW_MODE==="production";}
export function assertReviewWorkspace(env:Record<string,string|undefined>){
 if(!reviewIsLive(env)){assertStagingReview(env);return;}
 const publicUrl=new URL(env.NEXT_PUBLIC_SUPABASE_URL||"");const serverUrl=new URL(env.SUPABASE_SERVER_URL||publicUrl.toString());
 if(publicUrl.protocol!=="https:"||serverUrl.protocol!=="https:"||serverUrl.hostname!==publicUrl.hostname||!publicUrl.hostname.endsWith(".supabase.co"))throw Error("Production review requires its verified HTTPS database.");
}
