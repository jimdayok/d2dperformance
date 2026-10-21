import { describe, expect, it } from "vitest";
import { revalidationHeaders } from "../../lib/site-manager/revalidation-headers";
describe("protected Roofing revalidation", () => {
 it("retains JWT verification and adds bypass only for the approved private origin", () => {
  expect(revalidationHeaders("roofing-ontop","https://roofing-ontop.vercel.app","signed","private")).toEqual({"content-type":"application/json",authorization:"Bearer signed","x-vercel-protection-bypass":"private"});
 });
 it.each(["https://www.roofingontop.com","https://roofing-ontop.vercel.app.example.com","http://roofing-ontop.vercel.app"])("does not forward the secret to %s", target => {
  expect(revalidationHeaders("roofing-ontop",target,"signed","private")).not.toHaveProperty("x-vercel-protection-bypass");
 });
 it("does not affect other clients",()=>expect(revalidationHeaders("alford-custom-homes","https://roofing-ontop.vercel.app","signed","private")).not.toHaveProperty("x-vercel-protection-bypass"));
});
