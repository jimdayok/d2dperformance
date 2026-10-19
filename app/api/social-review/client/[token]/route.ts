import {flushSocialReviewEmails} from "@/lib/social-review/delivery";
import {after,NextResponse} from "next/server";
import {z} from "zod";
import {loadGuestReview,hashReviewToken} from "@/lib/social-review/guest";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
import {isSameOrigin} from "@/lib/social-ai/request";
import {reviewEditFields,editPatch} from "@/lib/social-review/input";
const base={id:z.uuid(),revision:z.number().int().positive(),lockVersion:z.number().int().positive()};
const schema=z.discriminatedUnion("action",[
 z.object({...base,action:z.enum(["comment","submit","request_changes","approve"]),body:z.string().trim().max(6000).default("")}),
 z.object({...base,action:z.literal("edit"),...reviewEditFields})
]);
const headers={"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer","X-Robots-Tag":"noindex, nofollow, noarchive"};
export const maxDuration=60;
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params;const data=await loadGuestReview(token);
 return NextResponse.json(data||{error:"This private review link has expired or was revoked."},{status:data?200:404,headers});
}
export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){
 try{
 if(Number(request.headers.get("content-length"))>100000)return NextResponse.json({error:"This review is too large."},{status:413,headers});
 if(!isSameOrigin(request))return NextResponse.json({error:"Open this action from your private review page."},{status:403,headers});
 const {token}=await params;const shared=await loadGuestReview(token);if(!shared)return NextResponse.json({error:"This review link is no longer available."},{status:404,headers});
 const input=schema.parse(await request.json());if(!shared.posts.some(p=>p.id===input.id))return NextResponse.json({error:"This post was not shared with you."},{status:404,headers});
 const db=createSupabaseAdminClient();const {error}=await db.rpc("client_social_review",{check_hash:hashReviewToken(token),check_post:input.id,check_revision:input.revision,check_version:input.lockVersion,check_action:input.action,check_body:"body" in input?input.body:"",check_patch:input.action==="edit"?editPatch(input):{}});
 if(error)return NextResponse.json({error:error.message},{status:409,headers});
 after(()=>flushSocialReviewEmails(shared.organizationId));
 return NextResponse.json({message:"Your review was saved. D2D will receive the update. Nothing has been published."},{headers});
 }catch(e){return NextResponse.json({error:e instanceof z.ZodError?"Check the review fields.":e instanceof Error?e.message:"Review unavailable."},{status:400,headers});}
}
