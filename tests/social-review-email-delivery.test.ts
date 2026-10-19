import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({rows:[] as Array<Record<string,unknown>>,sample:false,verified:true,restricted:false,send:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("resend",()=>({Resend:class{domains={list:async()=>state.restricted?({data:null,error:{message:"This API key is restricted to only send emails"}}):({data:{data:[{name:"d2dmktg.com",status:state.verified?"verified":"pending"}]},error:null})};emails={send:state.send};}}));
vi.mock("@/lib/supabase/admin",()=>({createSupabaseAdminClient:()=>({from:(table:string)=>{
 const where:Record<string,unknown>={};let patch:Record<string,unknown>|null=null;
 const apply=()=>{const rows=state.rows.filter(r=>Object.entries(where).every(([k,v])=>r[k]===v));if(patch)for(const r of rows)Object.assign(r,patch);return rows;};
 const q={select:()=>q,eq:(k:string,v:unknown)=>{where[k]=v;return q;},order:()=>q,limit:async()=>({data:apply().map(r=>({...r})),error:null}),update:(p:Record<string,unknown>)=>{patch=p;return q;},maybeSingle:async()=>({data:table==="social_review_posts"?{is_test:state.sample}:apply()[0]||null,error:null}),then:(resolve:(v:unknown)=>unknown)=>Promise.resolve({data:apply(),error:null}).then(resolve)};return q;
}})}));
import {flushSocialReviewEmails,socialEmailReadiness} from "@/lib/social-review/delivery";
beforeEach(()=>{
 vi.stubEnv("D2D_SOCIAL_REVIEW_MODE","production");vi.stubEnv("D2D_SOCIAL_REVIEW_STAGING","false");vi.stubEnv("RESEND_API_KEY","not-a-real-key");vi.stubEnv("NEXT_PUBLIC_PORTAL_URL","https://webadmin.d2dmktg.com");
 state.sample=false;state.verified=true;state.restricted=false;state.send.mockReset().mockResolvedValue({data:{id:"provider-accepted"},error:null});
 state.rows=[{id:"outbox-1",organization_id:"org-1",post_id:"post-1",status:"queued",event:"approval_requested",staff_recipients:["jim@d2dmktg.com","andrea@d2dmktg.com"],client_recipients:["client@example.test"],provider_ids:{},payload:{title:"Post",organization:"Client",body:"Ready for review",review_path:"/review/social/"+"a".repeat(64)}}];
});
describe("Production email outbox",()=>{
 it("does not send from private staging",async()=>{vi.stubEnv("D2D_SOCIAL_REVIEW_STAGING","true");await flushSocialReviewEmails("org-1");expect(state.send).not.toHaveBeenCalled();expect(state.rows[0].status).toBe("queued");});
 it("routes staff and client messages separately with stable idempotency and scoped links",async()=>{await flushSocialReviewEmails("org-1");expect(state.send).toHaveBeenCalledTimes(2);expect(state.send.mock.calls[0][0].to).toEqual(["jim@d2dmktg.com","andrea@d2dmktg.com"]);expect(state.send.mock.calls[1][0].to).toEqual(["client@example.test"]);expect(state.send.mock.calls[1][0].html).toContain("https://webadmin.d2dmktg.com/review/social/");expect(state.send.mock.calls[1][0].from).toBe("D2D Marketing <socialpages@d2dmktg.com>");expect(state.send.mock.calls[1][1]).toEqual({idempotencyKey:"social-review/outbox-1/client"});expect(state.rows[0].status).toBe("sent");await flushSocialReviewEmails("org-1");expect(state.send).toHaveBeenCalledTimes(2);});
 it("does not send another organization’s queue or any sample post",async()=>{await flushSocialReviewEmails("other-org");expect(state.send).not.toHaveBeenCalled();state.sample=true;await flushSocialReviewEmails("org-1");expect(state.send).not.toHaveBeenCalled();expect(state.rows[0].status).toBe("preview_only");});
 it("fails closed when the sender domain is unverified",async()=>{state.verified=false;await flushSocialReviewEmails("org-1");expect(state.send).not.toHaveBeenCalled();expect(state.rows[0].status).toBe("failed");});
 it("supports the existing least-privilege send-only key without claiming a domain check",async()=>{state.restricted=true;expect(await socialEmailReadiness()).toMatchObject({verified:false,canSend:true});await flushSocialReviewEmails("org-1");expect(state.send).toHaveBeenCalledTimes(2);expect(state.rows[0].status).toBe("sent");});
 it("records provider rejection instead of claiming delivery",async()=>{state.send.mockResolvedValue({data:null,error:{message:"Rejected"}});await flushSocialReviewEmails("org-1");expect(state.rows[0].status).toBe("failed");expect(state.rows[0].delivery_error).toBe("Rejected");});
});
