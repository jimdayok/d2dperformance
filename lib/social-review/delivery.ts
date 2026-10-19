import "server-only";
import {Resend} from "resend";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
import {buildSocialReviewEmail} from "./email-template";
import {reviewIsLive} from "./model";
const sender="D2D Marketing <socialpages@d2dmktg.com>";
export async function socialEmailReadiness(){
 if(!reviewIsLive(process.env))return {configured:false,verified:false,canSend:false,reason:"Preview-only staging"};
 if(!process.env.RESEND_API_KEY)return {configured:false,verified:false,canSend:false,reason:"Email transport is not configured"};
 const result=await new Resend(process.env.RESEND_API_KEY).domains.list();
 if(result.error){
  const sendOnly=result.error.message==="This API key is restricted to only send emails";
  return {configured:true,verified:false,canSend:sendOnly,reason:sendOnly?"Send-only key: the email provider validates the sender on each send":"Email domain verification could not be checked"};
 }
 const verified=Boolean(result.data?.data.some(d=>d.name.toLowerCase()==="d2dmktg.com"&&d.status==="verified"));
 return {configured:true,verified,canSend:verified,reason:verified?"D2D sender domain verified":"Verify d2dmktg.com in the email provider before sending"};
}
export async function flushSocialReviewEmails(organizationId:string){
 if(!reviewIsLive(process.env))return;
 const db=createSupabaseAdminClient();
 const {data:rows,error}=await db.from("social_review_outbox").select("*").eq("organization_id",organizationId).eq("status","queued").order("created_at").limit(15);
 if(error)throw Error("Email queue could not be read");if(!rows?.length)return;
 const ready=await socialEmailReadiness();
 if(!ready.canSend){await db.from("social_review_outbox").update({status:"failed",delivery_error:ready.reason}).eq("organization_id",organizationId).eq("status","queued");return;}
 const resend=new Resend(process.env.RESEND_API_KEY);
 const base=new URL(process.env.NEXT_PUBLIC_PORTAL_URL||"https://webadmin.d2dmktg.com");if(base.protocol!=="https:")throw Error("A secure portal URL is required for client emails");
 for(const row of rows){
  if(row.post_id){const {data:post}=await db.from("social_review_posts").select("is_test").eq("id",row.post_id).eq("organization_id",organizationId).maybeSingle();if(!post||post.is_test){await db.from("social_review_outbox").update({status:"preview_only"}).eq("id",row.id).eq("status","queued");continue;}}
  const {data:claim}=await db.from("social_review_outbox").update({status:"processing",delivery_error:null}).eq("id",row.id).eq("status","queued").select("id").maybeSingle();if(!claim)continue;
  const providerIds:Record<string,string>=row.provider_ids||{};
  try{
   for(const role of ["staff","client"] as const){
    const to=[...new Set((role==="staff"?row.staff_recipients:row.client_recipients) as string[])];if(!to.length){if(role==="client"&&row.event==="approval_requested")throw Error("Client approval recipients are not configured");continue;}
    if(providerIds[role])continue;
    const path=role==="client"&&/^\/review\/social\/[a-f0-9]{64}$/.test(row.payload.review_path||"")?row.payload.review_path:"/portal/marketing?organization="+organizationId;
    const message=buildSocialReviewEmail({event:row.event,title:row.payload.title,organization:row.payload.organization,body:row.payload.body,campaign:row.payload.campaign,reviewUrl:new URL(path,base).toString(),recipientRole:role,live:true});
    const result=await resend.emails.send({from:sender,to,replyTo:"socialpages@d2dmktg.com",subject:message.subject,text:message.text,html:message.html},{idempotencyKey:"social-review/"+row.id+"/"+role});
    if(result.error||!result.data?.id)throw Error(result.error?.message||"Email provider did not confirm acceptance");providerIds[role]=result.data.id;
    const saved=await db.from("social_review_outbox").update({provider_ids:providerIds}).eq("id",row.id).eq("status","processing");if(saved.error)throw Error("Provider accepted the email; reconcile its id before retrying");
   }
   const saved=await db.from("social_review_outbox").update({status:"sent",provider_ids:providerIds,delivered_at:new Date().toISOString()}).eq("id",row.id).eq("status","processing");if(saved.error)throw Error("Reconcile email provider acceptance before retrying");
  }catch(e){await db.from("social_review_outbox").update({status:"failed",provider_ids:providerIds,delivery_error:(e instanceof Error?e.message:"Email delivery failed").slice(0,500)}).eq("id",row.id).eq("status","processing");}
 }
}
