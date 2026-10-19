import {NextResponse} from "next/server";
import {z} from "zod";import sharp from "sharp";
import {getCurrentUser} from "@/lib/site-manager/access";
import {requireProductAccess} from "@/lib/d2d-platform/access";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
import {isSameOrigin} from "@/lib/social-ai/request";
import {searchStock} from "@/lib/creative-studio/stock";
export const runtime="nodejs";
export async function GET(request:Request){try{
 if(!await getCurrentUser())return NextResponse.json({error:"Sign in first."},{status:401});
 const p=new URL(request.url).searchParams,org=z.string().uuid().parse(p.get("organization"));await requireProductAccess(org,"social",["manager","creator"]);
 return NextResponse.json({assets:await searchStock(z.string().trim().min(2).max(100).parse(p.get("q")))},{headers:{"Cache-Control":"no-store"}});
}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Stock unavailable."},{status:400})}}
export async function POST(request:Request){try{
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Sign in first."},{status:401});if(!isSameOrigin(request))return NextResponse.json({error:"Refresh first."},{status:403});
 const input=z.object({organizationId:z.string().uuid(),title:z.string().startsWith("File:").max(250)}).parse(await request.json());await requireProductAccess(input.organizationId,"social",["manager","creator"]);
 const asset=(await searchStock("",input.title)).find(a=>a.title===input.title);if(!asset?.cleared)throw Error("Only confirmed CC0 or public-domain images can be imported.");
 const r=await fetch(asset.url,{redirect:"error",signal:AbortSignal.timeout(30000)});if(!r.ok||!r.body||Number(r.headers.get("content-length"))>10000000)throw Error("Choose a smaller stock image.");
 const chunks:Uint8Array[]=[];let size=0;const reader=r.body.getReader();try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>10000000){await reader.cancel();throw Error("Stock image exceeds 10 MB.");}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=await sharp(Buffer.concat(chunks),{limitInputPixels:25000000}).rotate().resize({width:2160,height:2160,fit:"inside",withoutEnlargement:true}).png().toBuffer();
 const id=crypto.randomUUID(),path=input.organizationId+"/stock/"+id+".png",db=createSupabaseAdminClient();
 const {error}=await db.storage.from("social-studio").upload(path,bytes,{contentType:"image/png"});if(error)throw Error("Stock import could not be saved.");
 const {error:saveError}=await db.from("social_studio_media").insert({id,organization_id:input.organizationId,storage_path:path,name:(asset.license+" · "+asset.title+" · "+asset.page).slice(0,200),mime_type:"image/png",created_by:user.id});if(saveError){await db.storage.from("social-studio").remove([path]);throw Error("Stock asset could not be recorded.");}
 return NextResponse.json({id,provenance:asset});
}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Stock import failed."},{status:400})}}
