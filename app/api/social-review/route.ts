import {legacyCreative,legacyDeliveryLocked} from "@/lib/social-review/legacy";
import {flushSocialReviewEmails,socialEmailReadiness} from "@/lib/social-review/delivery";
import {after,NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentUser} from "@/lib/site-manager/access";
import {requireProductAccess} from "@/lib/d2d-platform/access";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
import {createSupabaseServerClient} from "@/lib/supabase/server";
import {isSameOrigin} from "@/lib/social-ai/request";
import {assertReviewWorkspace,canTransition,reviewIsLive} from "@/lib/social-review/model";

import {reviewCaptions as captions,reviewEditFields,editPatch} from "@/lib/social-review/input";
const inputSchema=z.discriminatedUnion("action",[
 z.object({action:z.literal("edit_caption"),organizationId:z.uuid(),id:z.uuid(),revision:z.number().int().positive(),lockVersion:z.number().int().positive(),platform:z.enum(["facebook","instagram","linkedin","tiktok","threads","x"]),caption:z.string().trim().min(1).max(10000)}),
 z.object({action:z.literal("samples"),organizationId:z.uuid()}),
 z.object({action:z.literal("import"),organizationId:z.uuid(),draftId:z.uuid()}),
 z.object({action:z.literal("note"),organizationId:z.uuid(),body:z.string().trim().min(1).max(6000)}),
 z.object({action:z.enum(["comment","submit","request_changes","approve","reopen","invite","publication_preview"]),organizationId:z.uuid(),id:z.uuid(),revision:z.number().int().positive(),lockVersion:z.number().int().positive(),body:z.string().trim().max(6000).default("")}),
 z.object({action:z.literal("edit"),organizationId:z.uuid(),id:z.uuid(),revision:z.number().int().positive(),lockVersion:z.number().int().positive(),...reviewEditFields,mediaIds:z.array(z.uuid()).max(12).optional()}),
 z.object({action:z.enum(["plan","schedule","reschedule"]),organizationId:z.uuid(),id:z.uuid(),revision:z.number().int().positive(),lockVersion:z.number().int().positive(),plannedFor:z.iso.datetime()}),
 z.object({action:z.literal("unschedule"),organizationId:z.uuid(),id:z.uuid(),revision:z.number().int().positive(),lockVersion:z.number().int().positive(),targetStatus:z.enum(["approved","pending","changes_requested"]),body:z.string().trim().max(6000).default("")}),
 z.object({action:z.literal("move"),organizationId:z.uuid(),id:z.uuid(),revision:z.number().int().positive(),lockVersion:z.number().int().positive(),targetStatus:z.enum(["idea","in_progress"])})
]);
const roles=["manager","creator","reviewer"] as const;
export const maxDuration=60;
export async function GET(request:Request) {
 try {
  assertReviewWorkspace(process.env);
  if(!await getCurrentUser()) return NextResponse.json({error:"Sign in to open this workspace."},{status:401});
  const org=z.uuid().parse(new URL(request.url).searchParams.get("organization"));
  const access=await requireProductAccess(org,"social",[...roles]);
  const db=createSupabaseAdminClient();
  const [posts,activity,media,notes,legacy]=await Promise.all([
   db.from("social_review_posts").select("*").eq("organization_id",org).order("updated_at",{ascending:false}),
   db.from("social_review_activity").select("id,post_id,kind,body,actor_name,created_at").eq("organization_id",org).order("created_at"),
   db.from("social_studio_media").select("id,name,mime_type,storage_path").eq("organization_id",org),
   db.from("social_review_notes").select("id,body,actor_name,created_at").eq("organization_id",org).order("created_at",{ascending:false}),
   db.from("social_content_batches").select("id,title,status").eq("organization_id",org)
  ]);
  for(const r of [posts,activity,media,notes,legacy]) if(r.error) throw Error("The social workspace could not be loaded.");
  const sharedMedia=new Set((posts.data??[]).flatMap(p=>p.content.mediaIds??[]));
  const visibleMedia=(media.data??[]).filter(m=>access.role!=="reviewer"||sharedMedia.has(m.id));
  const signed=await Promise.all(visibleMedia.map(async m=>{
   const {data,error}=await db.storage.from("social-studio").createSignedUrl(m.storage_path,3600);
   if(error) throw Error("A private media preview could not be opened.");
   return {id:m.id,name:m.name,type:m.mime_type,url:data.signedUrl.replace(process.env.SUPABASE_SERVER_URL||process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_URL!)};
  }));
  const deliveries=reviewIsLive(process.env)?await db.from("social_deliveries").select("post_id,revision,state,result,created_at").eq("organization_id",org).neq("state","cancelled").order("created_at",{ascending:false}):{data:[]};
  const routes=reviewIsLive(process.env)?await db.from("social_delivery_routes").select("platform").eq("organization_id",org):{data:[]};
  const mapped=(posts.data??[]).map(p=>({...p,delivery:deliveries.data?.find(d=>d.post_id===p.id&&d.revision===p.revision),media:p.is_test&&p.content.sampleImage?(p.content.sampleImages||[p.content.sampleImage]).map((url:string)=>({url,type:"image/jpeg",alt:"D2D portfolio photograph used only as sample creative"})):legacyCreative(p.content).length?legacyCreative(p.content):(p.content.mediaIds??[]).flatMap((id:string)=>{const m=signed.find(x=>x.id===id);return m?[{url:m.url,type:m.type,alt:m.name}]:[]})}));
  return NextResponse.json({posts:mapped,activity:activity.data,notes:notes.data,media:signed,role:access.role,legacyBatches:legacy.data,publishingEnabled:Boolean(routes.data?.length),mode:reviewIsLive(process.env)?"production-planning":"isolated-test-scheduling"},{headers:{"Cache-Control":"no-store"}});
 } catch(e) { return NextResponse.json({error:e instanceof Error?e.message:"Workspace unavailable."},{status:403}); }
}
export async function POST(request:Request) {
 try {
  assertReviewWorkspace(process.env);
  const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Sign in first."},{status:401});
  if(!isSameOrigin(request))return NextResponse.json({error:"Open this action from the private workspace."},{status:403});
  if(Number(request.headers.get("content-length"))>50000)return NextResponse.json({error:"This request is too large."},{status:413});
  const input=inputSchema.parse(await request.json());
  const reviewAction=["approve","schedule","reschedule","request_changes","unschedule"].includes(input.action);
  const allowed=reviewAction?["manager","reviewer"] as const:input.action==="comment"||input.action==="note"?roles:["manager","creator"] as const;
  await requireProductAccess(input.organizationId,"social",[...allowed]);
  after(()=>flushSocialReviewEmails(input.organizationId));
  const db=createSupabaseAdminClient();
  if(input.action==="samples"){
   const existing=await db.from("social_review_posts").select("id").eq("organization_id",input.organizationId).eq("is_test",true).limit(1);
   if(existing.error)throw Error("Sample project unavailable.");
   if(!existing.data?.length){
    const now=new Date();const date=(days:number)=>{const d=new Date(now);d.setUTCDate(d.getUTCDate()+days);d.setUTCHours(16,0,0,0);return d.toISOString();};
    const samples=[
     ["A little behind the scenes","idea",null,"hero-branding-lives-day2day.jpg","graphic","A sample idea for showing the people behind the work."],
     ["Make room for your next idea","in_progress",date(3),"better-together-hero.jpg","carousel","Sample caption for a conversation about your next project."],
     ["Good work starts with a conversation","pending",date(2),"services-hero.jpg","graphic","Every project starts with a conversation. What would you like your audience to understand about your business?"],
     ["The details make the difference","pending",date(5),"contact-hero.jpg","graphic","A sample post about the small details that bring a brand together."],
     ["A fresh perspective","pending",date(7),"jilly-bean-photography.jpg","graphic","A sample creative direction using existing D2D portfolio imagery."],
     ["What are you working toward?","in_progress",date(10),"elite-companies.jpg","graphic","A sample question for starting a useful conversation with your audience."]
    ];
    const {error}=await db.from("social_review_posts").insert(samples.map(([title,status,planned_for,image,kind,caption])=>({organization_id:input.organizationId,title,project:"Sample project",status,planned_for,is_test:true,created_by:user.id,content:{kind,captions:{facebook:caption,instagram:caption},mediaIds:[],tags:["Sample creative"],brief:"Private review example. Existing D2D portfolio imagery, not an approved customer campaign.",sampleImage:"/assets/original/"+image,...(kind==="carousel"?{sampleImages:["/assets/original/"+image,"/assets/original/hero-branding-lives-day2day.jpg"]}:{})}})));
    if(error)throw Error("Samples could not be saved.");
   }
   return NextResponse.json({message:"Sample project is ready. These posts cannot reach social networks."});
  }
  if(input.action==="import"){
   const {data:draft,error}=await db.from("social_studio_drafts").select("*").eq("id",input.draftId).eq("organization_id",input.organizationId).single();
   if(error||!draft||draft.content?.source?.studioProject)throw Error("Choose a draft from this client's library.");
   captions.parse(draft.content.captions);
   const {data:existing}=await db.from("social_review_posts").select("id").eq("source_draft_id",draft.id).maybeSingle();
   if(existing)return NextResponse.json({id:existing.id,message:"This draft is already on the board. Open it there to review the saved version."});
   const {data,error:saveError}=await db.from("social_review_posts").insert({organization_id:input.organizationId,source_draft_id:draft.id,title:draft.title,planned_for:draft.planned_for,created_by:user.id,content:{...draft.content,tags:[],brief:draft.content.topic||""},is_test:false,status:"in_progress",project:"Studio drafts"}).select("id").single();
   if(saveError)throw Error("This draft could not be added. Refresh and try again.");
   return NextResponse.json({id:data.id,message:reviewIsLive(process.env)?"Added to the board. Review and choose the planned date independently.":"Added to the board. Real approval and delivery remain blocked."});
  }
  if(input.action==="note"){
   const {error}=await db.from("social_review_notes").insert({organization_id:input.organizationId,body:input.body,actor_id:user.id,actor_name:user.user_metadata?.display_name||"Team member"});
   if(error)throw Error("This project note could not be saved.");
   return NextResponse.json({message:"Project note saved."});
  }
  const {data:post}=await db.from("social_review_posts").select("*").eq("id",input.id).eq("organization_id",input.organizationId).maybeSingle();
  if(!post)return NextResponse.json({error:"This post is not available to this client."},{status:404});
  const delivery=await db.from("social_deliveries").select("state").eq("post_id",post.id).in("state",["dispatching","submitted","published","uncertain"]).limit(1);
  if(delivery.data?.length&&input.action!=="comment")return NextResponse.json({error:"This post has entered publishing. Check the delivery result; create a new post for different content."},{status:409});
  if(legacyDeliveryLocked(post)&&input.action!=="comment")return NextResponse.json({error:"This existing publishing schedule is preserved. Manage its live delivery in D2D Social before changing it here."},{status:409});
  if(!post.is_test&&reviewIsLive(process.env)&&["submit","invite"].includes(input.action)){
   const {data:settings}=await db.from("social_review_email_settings").select("client_recipients").eq("organization_id",input.organizationId).maybeSingle();
   if(!settings?.client_recipients?.length)return NextResponse.json({error:"Set this client’s approval recipients in Emails before sending a review request."},{status:400});
   const readiness=await socialEmailReadiness();
   if(!readiness.canSend)return NextResponse.json({error:"Approval email is not ready. Check the D2D sender configuration in Emails before sending a review request."},{status:400});
  }
  if(input.action==="edit_caption"){
   const session=await createSupabaseServerClient();const {error}=await session.rpc("edit_social_review_caption",{check_post:input.id,check_revision:input.revision,check_version:input.lockVersion,check_platform:input.platform,check_caption:input.caption});
   if(error)return NextResponse.json({error:error.message},{status:409});
   return NextResponse.json({message:post.status==="scheduled"?"Caption saved. Planned date and previous approval cleared; review and schedule again.":"Caption saved. Previous approval cleared."});
  }
  canTransition({...post,is_test:post.is_test||reviewIsLive(process.env),planned_for:"plannedFor" in input?input.plannedFor:post.planned_for},input.action);
  const patch=input.action==="edit"?{...editPatch(input),...(input.mediaIds?{mediaIds:input.mediaIds}:{})}:"plannedFor" in input?{planned_for:input.plannedFor}:(input.action==="move"||input.action==="unschedule")?{target_status:input.targetStatus}:{};
  const session=await createSupabaseServerClient();
  const {error}=await session.rpc("transition_social_review",{check_post:input.id,check_revision:input.revision,check_action:input.action,check_body:"body" in input?input.body:"",check_patch:patch,check_version:input.lockVersion});
  if(error)return NextResponse.json({error:error.message},{status:409});
  return NextResponse.json({message:input.action==="schedule"||input.action==="reschedule"?"Schedule saved. The approved version will publish at this time when its destination is connected.":input.action==="approve"?"Approved. If this post has a future date and a connected destination, it is now scheduled to publish automatically.":"Saved. Email updates are queued for the configured recipients."});
 } catch(e) {return NextResponse.json({error:e instanceof z.ZodError?"Check the post fields and try again.":e instanceof Error?e.message:"This action could not be saved."},{status:400});}
}
