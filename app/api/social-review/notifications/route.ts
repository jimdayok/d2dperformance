import {flushSocialReviewEmails,socialEmailReadiness} from "@/lib/social-review/delivery";
import {after,NextResponse} from "next/server";
import {z} from "zod";
import {assertReviewWorkspace,reviewIsLive} from "@/lib/social-review/model";
import {getCurrentUser} from "@/lib/site-manager/access";
import {requireProductAccess} from "@/lib/d2d-platform/access";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
import {isSameOrigin} from "@/lib/social-ai/request";
import {buildSocialReviewEmail} from "@/lib/social-review/email-template";
const defaults={sender:"D2D Marketing <socialpages@d2dmktg.com>",staff_recipients:["jim@d2dmktg.com","andrea@d2dmktg.com"],client_recipients:[] as string[]};
export async function GET(request:Request){
 try{assertReviewWorkspace(process.env);if(!await getCurrentUser())return NextResponse.json({error:"Sign in first."},{status:401});
 const org=z.uuid().parse(new URL(request.url).searchParams.get("organization"));await requireProductAccess(org,"social",["manager","creator"]);
 const db=createSupabaseAdminClient();const [settings,outbox,links]=await Promise.all([db.from("social_review_email_settings").select("sender,staff_recipients,client_recipients").eq("organization_id",org).maybeSingle(),db.from("social_review_outbox").select("*").eq("organization_id",org).order("created_at",{ascending:false}).limit(50),db.from("social_review_links").select("id,post_ids,expires_at,revoked_at").eq("organization_id",org).order("created_at",{ascending:false}).limit(50)]);
 if(settings.error||outbox.error||links.error)throw Error("Notification previews are unavailable.");
 const base=new URL(request.url).protocol+"//"+(request.headers.get("host")||new URL(request.url).host);
 const messages=(outbox.data??[]).map(row=>({...row,previews:["staff","client"].map(recipientRole=>({...buildSocialReviewEmail({event:row.event,title:row.payload.title,organization:row.payload.organization,body:row.payload.body,campaign:row.payload.campaign,reviewUrl:new URL(recipientRole==="client"?row.payload.review_path:"/portal/marketing?organization="+org,base).toString(),recipientRole,live:reviewIsLive(process.env)}),role:recipientRole,to:recipientRole==="client"?row.client_recipients:row.staff_recipients})),reviewUrl:row.payload.review_path?.startsWith("/review/social/")?row.payload.review_path:null}));
 const readiness=await socialEmailReadiness();
 return NextResponse.json({settings:settings.data||defaults,messages,links:links.data,delivery:reviewIsLive(process.env)?"live_outbox":"preview_only",senderVerified:readiness.verified,senderCanSend:readiness.canSend,senderStatus:readiness.reason},{headers:{"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unavailable."},{status:403});}
}
export async function POST(request:Request){
 try{assertReviewWorkspace(process.env);if(!await getCurrentUser()||!isSameOrigin(request))return NextResponse.json({error:"Open these controls from your signed-in workspace."},{status:403});
 const input=z.discriminatedUnion("action",[
 z.object({action:z.literal("settings"),organizationId:z.uuid(),clientRecipients:z.array(z.email()).max(12)}),
 z.object({action:z.literal("revoke"),organizationId:z.uuid(),linkId:z.uuid()})
 ]).parse(await request.json());
 await requireProductAccess(input.organizationId,"social",["manager"]);
 const db=createSupabaseAdminClient();
 const result=input.action==="revoke"?await db.from("social_review_links").update({revoked_at:new Date().toISOString()}).eq("id",input.linkId).eq("organization_id",input.organizationId):await db.from("social_review_email_settings").upsert({organization_id:input.organizationId,...defaults,client_recipients:[...new Set(input.clientRecipients.map(x=>x.toLowerCase()))]});
 if(result.error)throw Error("These notification settings could not be saved.");
 after(()=>flushSocialReviewEmails(input.organizationId));
 return NextResponse.json({message:input.action==="revoke"?"Review link revoked.":reviewIsLive(process.env)?"Recipient routing saved for future notifications.":"Recipient routing saved. Emails remain in the preview outbox."});
 }catch(e){return NextResponse.json({error:e instanceof z.ZodError?"Enter valid recipient email addresses.":e instanceof Error?e.message:"Unavailable."},{status:400});}
}
