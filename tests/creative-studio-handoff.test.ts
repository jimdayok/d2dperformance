import {beforeEach,it,expect,vi} from "vitest";
const m=vi.hoisted(()=>({db:vi.fn(),after:vi.fn(),flush:vi.fn(),access:vi.fn(),draft:{id:"22222222-2222-4222-8222-222222222222",title:"Finished creative",content:{captions:{facebook:"A reviewed creative concept"},mediaIds:[],topic:"Concept"}},existing:null as null|{id:string},insert:vi.fn()}));
vi.mock("@/lib/site-manager/access",()=>({getCurrentUser:vi.fn(async()=>({id:"creator"}))}));
vi.mock("@/lib/d2d-platform/access",()=>({requireProductAccess:m.access}));
vi.mock("@/lib/supabase/admin",()=>({createSupabaseAdminClient:m.db}));
vi.mock("@/lib/supabase/server",()=>({createSupabaseServerClient:vi.fn()}));
vi.mock("@/lib/social-review/delivery",()=>({flushSocialReviewEmails:m.flush,socialEmailReadiness:vi.fn()}));
vi.mock("@/lib/social-review/model",()=>({assertReviewWorkspace:vi.fn(),canTransition:vi.fn(),reviewIsLive:()=>false}));
vi.mock("next/server",async()=>{const actual=await vi.importActual<typeof import("next/server")>("next/server");return {...actual,after:m.after};});
import {POST} from "@/app/api/social-review/route";
const org="11111111-1111-4111-8111-111111111111";
function request(){return new Request("https://studio.test/api/social-review",{method:"POST",headers:{host:"studio.test",origin:"https://studio.test","content-type":"application/json"},body:JSON.stringify({action:"import",organizationId:org,draftId:m.draft.id})});}
beforeEach(()=>{vi.clearAllMocks();m.draft.content={captions:{facebook:"A reviewed creative concept"},mediaIds:[],topic:"Concept"};m.existing=null;m.db.mockImplementation(()=>({from:(table:string)=>{const query:any={select:()=>query,eq:()=>query,single:async()=>({data:table==="social_studio_drafts"?m.draft:{id:"post"}}),maybeSingle:async()=>({data:m.existing}),insert:(value:unknown)=>{m.insert(value);return query}};return query}}));});
it("hands finished creative to the existing in-progress workflow without scheduling or email delivery",async()=>{expect((await POST(request())).status).toBe(200);expect(m.insert).toHaveBeenCalledWith(expect.objectContaining({organization_id:org,source_draft_id:m.draft.id,status:"in_progress"}));expect(m.access).toHaveBeenCalledWith(org,"social",["manager","creator"]);expect(m.flush).not.toHaveBeenCalled();});
it("reuses an existing handoff instead of duplicating the board item",async()=>{m.existing={id:"already-added"};expect((await POST(request())).status).toBe(200);expect(m.insert).not.toHaveBeenCalled();});
it("keeps unfinished Studio project records out of Social",async()=>{Object.assign(m.draft.content,{source:{studioProject:true}});expect((await POST(request())).status).toBe(400);expect(m.insert).not.toHaveBeenCalled();});
