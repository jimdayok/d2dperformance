import sharp from "sharp";
import {studioMedia,vaultPhotos} from "@/lib/social-ai/media";
import {NextResponse} from "next/server";
import {z} from "zod";
import {createHash} from "node:crypto";
import {getCurrentUser} from "@/lib/site-manager/access";
import {requireProductAccess} from "@/lib/d2d-platform/access";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
import {isSameOrigin} from "@/lib/social-ai/request";
import {loadBrand} from "@/lib/social-ai/brand";
import {creativeStyles,sceneSchema} from "@/lib/creative-studio/model";
import {enhanceIntent} from "@/lib/creative-studio/enhance";
export const runtime="nodejs";export const maxDuration=120;
const inputSchema=z.object({requestId:z.string().uuid(),organizationId:z.string().uuid(),brief:z.string().trim().min(8).max(2000),kind:z.enum(["video","graphic","carousel"]),style:z.enum(creativeStyles),platform:z.enum(["instagram","facebook","linkedin"]),aspect:z.enum(["portrait","square","landscape"]),duration:z.number().min(5).max(30),model:z.literal("wavespeed-ai/wan-2.2/i2v-5b-720p"),assets:z.array(z.object({id:z.string().uuid(),name:z.string().max(200),source:z.enum(["upload","vault"]).default("upload"),role:z.string().max(50)})).max(12),settings:z.record(z.string(),z.union([z.string().max(1000),z.number()])),scenes:z.array(sceneSchema).max(4),refinement:z.string().max(1000).default("")});
export async function POST(request:Request){
 let jobId:string|undefined;
 try{
  const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Sign in first."},{status:401});
  if(!isSameOrigin(request))return NextResponse.json({error:"Refresh and try again."},{status:403});
  if(Number(request.headers.get("content-length"))>24000)throw Error("Please shorten the creative brief.");
  const input=inputSchema.parse(await request.json());const access=await requireProductAccess(input.organizationId,"social",["manager","creator"]);
  const db=createSupabaseAdminClient(),hash=createHash("sha256").update(JSON.stringify({...input,requestId:undefined})).digest("hex");
  const {data:prior}=await db.from("social_ai_jobs").select("created_by,organization_id,status,brand_sources").eq("id",input.requestId).maybeSingle();
  if(prior){if(prior.created_by!==user.id||prior.organization_id!==input.organizationId||prior.brand_sources?.requestHash!==hash)throw Error("This request is not available.");if(prior.status==="completed")return NextResponse.json({guidance:prior.brand_sources.guidance});throw Error("This guidance request already exists. Check your saved project before requesting another.");}
  const logo=typeof input.settings.logoAsset==="string"?input.settings.logoAsset:"";
  const brand=await loadBrand(input.organizationId,access.organizationSlug,logo.startsWith("vault:")?z.string().uuid().parse(logo.slice(6)):undefined,logo.startsWith("upload:")?z.string().uuid().parse(logo.slice(7)):undefined);
  const uploaded=input.assets.filter(a=>a.source==="upload"),vault=input.assets.filter(a=>a.source==="vault");
  const {data:records,error:assetError}=uploaded.length?await db.from("social_studio_media").select("id,name,mime_type").eq("organization_id",input.organizationId).in("id",uploaded.map(a=>a.id)):{data:[],error:null};
  if(assetError||records?.length!==new Set(uploaded.map(a=>a.id)).size||vault.some(a=>!brand.images.some(i=>i.id===a.id)))throw Error("Choose media approved for this client.");
  const uploadedPhotos=(records??[]).filter(a=>a.mime_type.startsWith("image/")).slice(0,4);
  const sources=[...await studioMedia(input.organizationId,uploadedPhotos.map(a=>a.id)),...await vaultPhotos(brand.vaultSlug,vault.slice(0,Math.max(0,4-uploadedPhotos.length)).map(a=>a.id))];
  const references=await Promise.all(sources.map(async image=>({mime_type:"image/png",bytes:await sharp(image.bytes,{limitInputPixels:25000000}).resize({width:400,height:400,fit:"inside"}).png().toBuffer()})));

  const estimate={copyInput:6000,copyOutputAllowance:6000,imageInputAllowance:0,imageOutputEstimate:0,totalAllowance:12000};
  const {data:reservation,error:reserveError}=await db.rpc("reserve_social_ai_job",{check_id:input.requestId,check_organization:input.organizationId,check_user:user.id,check_kind:"graphic",check_sources:{...brand.source,requestHash:hash,studioEnhancement:true},check_estimate:estimate});if(reserveError)throw Error(reserveError.message);if(reservation?.existing)return NextResponse.json({error:"This protected guidance request is already processing. Check the saved project before retrying."},{status:409});jobId=input.requestId;
  const {guidance,usage}=await enhanceIntent(input,{name:brand.name,story:brand.story,voice:brand.voice,colors:[brand.primaryColor,brand.accentColor],guidelines:JSON.stringify(brand.guidelines).slice(0,20000),hashtags:brand.hashtags},references);
  const eligible=new Set(input.assets.filter(a=>["Opening Frame","Subject Reference","Exact Product Reference"].includes(a.role)).map(a=>a.id));
  guidance.scenes=guidance.scenes.map(s=>({...s,assetId:eligible.has(s.assetId)?s.assetId:""}));
  const {error}=await db.from("social_ai_jobs").update({status:"completed",message:"Creative guidance saved; no media generation submitted.",brand_sources:{...brand.source,requestHash:hash,studioEnhancement:true,guidance},copy_usage:{stage:"copy",model:process.env.OPENAI_SOCIAL_MODEL||"gpt-5-mini",usage},image_usage:{stage:"image",model:"none",usage:{total_tokens:0}}}).eq("id",jobId);if(error)throw Error("Guidance could not be saved.");
  return NextResponse.json({guidance},{headers:{"Cache-Control":"no-store"}});
 }catch(e){if(jobId)await createSupabaseAdminClient().from("social_ai_jobs").update({status:"failed",message:"Creative guidance failed; no media generation submitted."}).eq("id",jobId);return NextResponse.json({error:e instanceof Error?e.message:"Creative guidance unavailable."},{status:400});}
}
