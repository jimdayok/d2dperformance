import {describe,it,expect} from "vitest";
import {assertStagingReview,canTransition,centralDay} from "@/lib/social-review/model";
const stage={D2D_SOCIAL_REVIEW_STAGING:"true",D2D_SOCIAL_SCHEDULING_ENABLED:"false",SUPABASE_SERVER_URL:"http://127.0.0.1:54321"};
const post={status:"pending" as const,revision:2,approved_revision:null,planned_for:"2099-01-20T16:00:00Z",is_test:true};
describe("Private independent post workflow",()=>{
 it("rejects a production database or enabled network delivery even when the staging flag is set",()=>{
  expect(()=>assertStagingReview(stage)).not.toThrow();
  for(const env of [{...stage,SUPABASE_SERVER_URL:"https://live.supabase.co"},{...stage,D2D_SOCIAL_SCHEDULING_ENABLED:"true"},{...stage,D2D_SOCIAL_REVIEW_STAGING:"false"}])expect(()=>assertStagingReview(env)).toThrow();
 });
 it("blocks real decisions and stale or unapproved scheduling",()=>{
  expect(()=>canTransition({...post,is_test:false},"approve")).toThrow(/Real post/);
  expect(()=>canTransition({...post,is_test:false},"schedule")).toThrow(/Real post/);
  expect(()=>canTransition(post,"schedule")).toThrow(/current version/);
  expect(()=>canTransition({...post,status:"approved",approved_revision:1},"schedule")).toThrow(/current version/);
  expect(()=>canTransition({...post,status:"approved",approved_revision:2},"schedule")).not.toThrow();
  expect(()=>canTransition({...post,status:"approved",approved_revision:2,planned_for:"2000-01-01T00:00:00Z"},"schedule")).toThrow(/future/);
 });
 it("keeps approved calendar times in the Central date including UTC midnight boundaries",()=>{
  expect(centralDay("2026-10-21T01:30:00Z")).toBe("2026-10-20");
  expect(centralDay("2026-12-21T03:30:00Z")).toBe("2026-12-20");
 });
});
