import {describe,it,expect} from "vitest";
import {centralISO,centralLocal} from "@/components/d2d-platform/social-studio-library";
import {isSameOrigin} from "@/lib/social-ai/request";
import {directionSchema} from "@/lib/social-ai/direction";
describe("Studio planning and request boundaries",()=>{
 it("keeps unscheduled ideas undated and preserves Central times across daylight-saving seasons",()=>{
  expect(centralISO("")).toBeNull();
  expect(centralISO("2026-10-20T09:15")).toBe("2026-10-20T14:15:00.000Z");
  expect(centralISO("2026-12-20T09:15")).toBe("2026-12-20T15:15:00.000Z");
  expect(centralLocal("2026-12-20T15:15:00.000Z")).toBe("2026-12-20T09:15");
  expect(()=>centralISO("2027-03-14T02:30")).toThrow();
 });
 it("allows a browser save behind a private proxy while rejecting foreign or absent origins",()=>{
  const req=(origin?:string)=>new Request("http://127.0.0.1:3104/api/social-studio",{headers:{host:"127.0.0.1:13104",...(origin?{origin}:{})}});
  expect(isSameOrigin(req("http://127.0.0.1:13104"))).toBe(true);
  expect(isSameOrigin(req("https://unrelated.example"))).toBe(false);
  expect(isSameOrigin(req())).toBe(false);
 });
 it("bounds render duration and rejects arbitrary settings",()=>{
  expect(directionSchema.parse({duration:5,trimStart:0}).duration).toBe(5);
  expect(directionSchema.safeParse({duration:3600}).success).toBe(false);
  expect(directionSchema.safeParse({lighting:101}).success).toBe(false);
  expect(directionSchema.safeParse({setting:"secret"}).success).toBe(false);
 });
});
