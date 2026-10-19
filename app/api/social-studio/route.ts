import {isSameOrigin} from "@/lib/social-ai/request";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentUser} from "@/lib/site-manager/access";
import {requireProductAccess} from "@/lib/d2d-platform/access";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
const contentSchema=z.object({logoId:z.string().uuid().optional(),uploadedLogoId:z.string().uuid().optional(),topic:z.string().max(4000).default(""),kind:z.enum(["graphic","video","carousel"]).default("graphic"),captions:z.record(z.string(),z.string().max(10000)).default({}),mediaIds:z.array(z.string().uuid()).max(12).default([]),brandImageIds:z.array(z.string().uuid()).max(12).default([]),direction:z.record(z.string(),z.union([z.string().max(2000),z.number()])).default({}),planId:z.string().uuid().nullable().optional(),source:z.unknown().optional()});
export async function GET(request:Request){
 try{
  if(!await getCurrentUser())return NextResponse.json({error:"Sign in first."},{status:401});
  const organizationId=z.string().uuid().parse(new URL(request.url).searchParams.get("organization"));
  await requireProductAccess(organizationId,"social",["manager","creator"]);
  const admin=createSupabaseAdminClient();
  const [{data:drafts,error},{data:media,error:mediaError}]=await Promise.all([
   admin.from("social_studio_drafts").select("*").eq("organization_id",organizationId).order("updated_at",{ascending:false}),
   admin.from("social_studio_media").select("*").eq("organization_id",organizationId).order("created_at",{ascending:false})
  ]);
  if(error||mediaError)throw Error("The content library could not be loaded.");
  const signed=await Promise.all((media??[]).map(async m=>{
   const {data}=await admin.storage.from("social-studio").createSignedUrl(m.storage_path,3600);
   return {id:m.id,name:m.name,mime_type:m.mime_type,purpose:m.storage_path.startsWith(organizationId+"/logos/")?"logo":"media",url:data?.signedUrl?.replace(process.env.SUPABASE_SERVER_URL||process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.D2D_STUDIO_STAGING==="true"?"/_staging/supabase":process.env.NEXT_PUBLIC_SUPABASE_URL!)??null};
  }));
  return NextResponse.json({drafts,media:signed},{headers:{"Cache-Control":"no-store"}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Library unavailable."},{status:400})}
}
export async function POST(request:Request){
 try{
  const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Sign in first."},{status:401});
  if(!isSameOrigin(request))return NextResponse.json({error:"Refresh and try again."},{status:403});
  if(Number(request.headers.get("content-length"))>50000)throw Error("Draft is too large.");
  const input=z.object({organizationId:z.string().uuid(),id:z.string().uuid().optional(),revision:z.number().int().positive().optional(),title:z.string().trim().min(1).max(180),plannedFor:z.string().datetime().nullable().default(null),content:contentSchema}).parse(await request.json());
  await requireProductAccess(input.organizationId,"social",["manager","creator"]);
  if(input.plannedFor&&Date.parse(input.plannedFor)<=Date.now())throw Error("Choose a future time.");
  const admin=createSupabaseAdminClient();
  if(input.content.mediaIds.length){
   const {data,error}=await admin.from("social_studio_media").select("id").eq("organization_id",input.organizationId).in("id",input.content.mediaIds);
   if(error||data?.length!==new Set(input.content.mediaIds).size)throw Error("Choose media from this client's library.");
  }
  const values={title:input.title,content:input.content,planned_for:input.plannedFor,updated_at:new Date().toISOString()};
  const result=input.id
   ? await admin.from("social_studio_drafts").update({...values,revision:(input.revision??0)+1}).eq("id",input.id).eq("organization_id",input.organizationId).eq("revision",input.revision??0).select("id").maybeSingle()
   : await admin.from("social_studio_drafts").insert({...values,organization_id:input.organizationId,created_by:user.id}).select("id").single();
  if(result.error||!result.data)throw Error("This draft changed or could not be saved. Refresh and try again.");
  return NextResponse.json({id:result.data.id,message:"Saved to your content library. Nothing has been published."});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Draft could not be saved."},{status:400})}
}
