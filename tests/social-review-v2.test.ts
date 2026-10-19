import {describe,it,expect} from "vitest";
import {reviewCaptions} from "@/lib/social-review/input";
import {socialPlatforms,previewWarnings} from "@/lib/social-review/platforms";
import {buildSocialReviewEmail} from "@/lib/social-review/email-template";
describe("Social review version two",()=>{
 it("supports the six requested networks and flags platform-specific preview limits",()=>{
  expect(socialPlatforms).toEqual(["facebook","instagram","linkedin","tiktok","threads","x"]);
  expect(reviewCaptions.parse({threads:"A draft",x:"A short draft",linkedin:"A professional draft"})).toHaveProperty("threads");
  expect(previewWarnings("x","x".repeat(281),"graphic")).toHaveLength(1);
  expect(previewWarnings("threads","x".repeat(501),"graphic")).toHaveLength(1);
  expect(previewWarnings("instagram","x".repeat(2201),"graphic")).toHaveLength(1);
 });
 it("escapes client content and never labels a staging email as delivered",()=>{
  const result=buildSocialReviewEmail({event:"approval_requested",title:'<script>alert("x")</script>',organization:"D2D & client",body:"<img src=x onerror=alert(1)>",reviewUrl:"https://review.example/review/social/test",recipientRole:"client"});
  expect(result.html).not.toContain("<script>");expect(result.html).toContain("&lt;script&gt;");expect(result.html).toContain("Not sent");
  expect(result.html).toContain("No account sign-in is required");
  expect(buildSocialReviewEmail({event:"note",title:"Notes",organization:"D2D",body:"Text",reviewUrl:"javascript:alert(1)",recipientRole:"staff"}).html).toContain('href="#"');
 });
});
