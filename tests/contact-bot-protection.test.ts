import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ send: vi.fn(), verify: vi.fn() }));
vi.mock("@/lib/contact-form", () => ({ sendContactSubmissionEmail: mocks.send, validateContactSubmission: () => null }));
vi.mock("@/lib/website-feedback-altcha", () => ({ createWebsiteFeedbackAltcha: () => ({ verifyHandler: mocks.verify }) }));
import { POST } from "@/app/api/contact/submit/route";
const request = (message = "We need a business strategy.") => new Request("https://performance.d2dmktg.com/api/contact/submit", {method:"POST",headers:{origin:"https://performance.d2dmktg.com","content-type":"application/json"},body:JSON.stringify({name:"Test Client",email:"client@example.com",message})});
describe("contact bot protection before email", () => {
 beforeEach(() => vi.resetAllMocks());
 it("rejects missing or invalid proof without emailing", async () => {
  mocks.verify.mockResolvedValue(Response.json({verification:{verified:false}}));
  expect((await POST(request())).status).toBe(403); expect(mocks.send).not.toHaveBeenCalled();
 });
 it("fails closed when verification is unavailable", async () => {
  mocks.verify.mockRejectedValue(new Error("unavailable"));
  expect((await POST(request())).status).toBe(503); expect(mocks.send).not.toHaveBeenCalled();
 });
 it("delivers a verified genuine inquiry", async () => {
  mocks.verify.mockResolvedValue(Response.json({verification:{verified:true}}));
  expect((await POST(request())).status).toBe(200); expect(mocks.send).toHaveBeenCalledOnce();
 });
 it("blocks the reported link sales pattern without emailing", async () => {
  expect((await POST(request("Here are my blogs for backlinks: https://one.example https://two.example https://three.example. My list and pricing details."))).status).toBe(422); expect(mocks.send).not.toHaveBeenCalled();
 });
});
