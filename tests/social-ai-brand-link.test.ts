import {describe,it,expect} from "vitest";
import {vaultSlug} from "../lib/social-ai/brand-link";
describe("brand tenant resolution",()=>{
 const d2d="209800de-4a2e-41cd-99a7-53bdf5fff3d1";
 it("uses the verified production D2D identity when the link has no tenant",()=>expect(vaultSlug(d2d,"d2d-marketing","https://brandvault.d2dmktg.com/auth/login")).toBe("d2dmktg"));
 it("honors explicit tenant links",()=>expect(vaultSlug(d2d,"d2d-marketing","https://brandvault.d2dmktg.com/app/verified-client")).toBe("verified-client"));
 it("does not apply the D2D mapping to other customers",()=>expect(vaultSlug("other-id","other-client")).toBe("other-client"));
 it("keeps the isolated staging customer identity",()=>expect(vaultSlug(d2d,"d2d-marketing",null,true)).toBe("d2d-marketing"));
});
