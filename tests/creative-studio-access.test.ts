import {beforeEach,it,expect,vi} from "vitest";
const mocks=vi.hoisted(()=>({user:vi.fn(),access:vi.fn(),brand:vi.fn(),enhance:vi.fn(),db:vi.fn()}));
vi.mock("@/lib/social-ai/media",()=>({loadUploadedMedia:vi.fn()}));
vi.mock("@/lib/site-manager/access",()=>({getCurrentUser:mocks.user}));
vi.mock("@/lib/d2d-platform/access",()=>({requireProductAccess:mocks.access}));
vi.mock("@/lib/social-ai/brand",()=>({loadBrand:mocks.brand}));
vi.mock("@/lib/supabase/admin",()=>({createSupabaseAdminClient:mocks.db}));
vi.mock("@/lib/creative-studio/enhance",()=>({enhanceIntent:mocks.enhance}));
import {POST} from "@/app/api/creative-studio/enhance/route";
const org="11111111-1111-4111-8111-111111111111";
const input={requestId:"22222222-2222-4222-8222-222222222222",organizationId:org,brief:"A roof promotion",kind:"video",style:"Cinematic",platform:"instagram",aspect:"portrait",duration:20,model:"wavespeed-ai/wan-2.2/i2v-5b-720p",assets:[],settings:{},scenes:[],refinement:""};
function request(origin="https://studio.example.test"){return new Request("https://studio.example.test/api/creative-studio/enhance",{method:"POST",headers:{host:"studio.example.test",origin,"content-type":"application/json"},body:JSON.stringify(input)});}
beforeEach(()=>{vi.clearAllMocks();mocks.user.mockResolvedValue({id:"creator"});mocks.access.mockResolvedValue({organizationSlug:"customer"});});
it("refuses anonymous users before provider or database use",async()=>{mocks.user.mockResolvedValue(null);expect((await POST(request())).status).toBe(401);expect(mocks.enhance).not.toHaveBeenCalled();expect(mocks.db).not.toHaveBeenCalled();});
it("rejects cross-origin requests without consuming an AI allowance",async()=>{expect((await POST(request("https://outside.test"))).status).toBe(403);expect(mocks.access).not.toHaveBeenCalled();expect(mocks.enhance).not.toHaveBeenCalled();});
it("checks creator access for the selected organization before reading its brand",async()=>{mocks.access.mockRejectedValue(Error("No client access"));expect((await POST(request())).status).toBe(400);expect(mocks.access).toHaveBeenCalledWith(org,"social",["manager","creator"]);expect(mocks.brand).not.toHaveBeenCalled();expect(mocks.enhance).not.toHaveBeenCalled();});
