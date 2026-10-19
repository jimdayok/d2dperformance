import {describe,it,expect} from "vitest";
import {assertReviewWorkspace,reviewIsLive} from "@/lib/social-review/model";
const production={D2D_SOCIAL_REVIEW_MODE:"production",NEXT_PUBLIC_SUPABASE_URL:"https://jxawbtbtjenurksrjhqf.supabase.co"};
describe("Production social review boundaries",()=>{
 it("requires explicit live mode and its HTTPS project, while leaving automatic delivery separate",()=>{
  expect(reviewIsLive({})).toBe(false);expect(()=>assertReviewWorkspace({})).toThrow();
  expect(()=>assertReviewWorkspace(production)).not.toThrow();
  expect(()=>assertReviewWorkspace({...production,D2D_SOCIAL_SCHEDULING_ENABLED:"true"})).not.toThrow();
  for(const change of [{NEXT_PUBLIC_SUPABASE_URL:"http://127.0.0.1:54321"},{SUPABASE_SERVER_URL:"http://localhost:54321"},{SUPABASE_SERVER_URL:"https://other.supabase.co"},{NEXT_PUBLIC_SUPABASE_URL:"https://untrusted.example"}])expect(()=>assertReviewWorkspace({...production,...change})).toThrow();
 });
 it("keeps isolated staging protections even if the live flag was accidentally copied",()=>{
  const stage={...production,D2D_SOCIAL_REVIEW_STAGING:"true",D2D_SOCIAL_SCHEDULING_ENABLED:"false",SUPABASE_SERVER_URL:"http://127.0.0.1:54321"};
  expect(reviewIsLive(stage)).toBe(false);expect(()=>assertReviewWorkspace(stage)).not.toThrow();expect(()=>assertReviewWorkspace({...stage,D2D_SOCIAL_SCHEDULING_ENABLED:"true"})).toThrow();
 });
});
