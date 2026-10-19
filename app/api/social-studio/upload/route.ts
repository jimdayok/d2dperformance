import {isSameOrigin} from "@/lib/social-ai/request";
import {NextResponse} from "next/server";
import {z} from "zod";
import sharp from "sharp";
import {getCurrentUser} from "@/lib/site-manager/access";
import {requireProductAccess} from "@/lib/d2d-platform/access";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
export const runtime="nodejs";
export async function POST(request:Request){
 try{
  const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Sign in first."},{status:401});
  if(!isSameOrigin(request))return NextResponse.json({error:"Refresh and try again."},{status:403});
  if(Number(request.headers.get("content-length"))>105000000)throw Error("Upload one file at a time, up to 100 MB.");
  const form=await request.formData(),organizationId=z.string().uuid().parse(form.get("organizationId"));
  await requireProductAccess(organizationId,"social",["manager","creator"]);
  const purpose=z.enum(["media","logo"]).parse(form.get("purpose")||"media");
  const file=form.get("file");if(!(file instanceof File)||!file.size||file.size>104857600)throw Error("Choose a photo or video up to 100 MB.");
  if(!["image/jpeg","image/png","image/webp","video/mp4","video/quicktime"].includes(file.type))throw Error("Use JPG, PNG, WebP, MP4 or MOV.");
  if(purpose==="logo"&&!file.type.startsWith("image/"))throw Error("Upload a PNG, JPG or WebP logo.");
  let bytes=Buffer.from(await file.arrayBuffer());let mime=file.type;
  if(mime.startsWith("image/")){
   if(file.size>10000000)throw Error("Photos must be 10 MB or smaller.");
   bytes=Buffer.from(await sharp(bytes,{limitInputPixels:25000000}).rotate().resize({width:2160,height:3840,fit:"inside",withoutEnlargement:true}).png().toBuffer());mime="image/png";
  }else if(bytes.toString("ascii",4,8)!=="ftyp")throw Error("This file is not a supported MP4 or MOV video.");
  const id=crypto.randomUUID(),path=organizationId+"/"+(purpose==="logo"?"logos/":"")+id+(mime==="image/png"?".png":mime==="image/jpeg"?".jpg":mime==="video/mp4"?".mp4":".mov"),admin=createSupabaseAdminClient();
  const {error}=await admin.storage.from("social-studio").upload(path,bytes,{contentType:mime});if(error)throw Error("The upload could not be stored.");
  const {error:saveError}=await admin.from("social_studio_media").insert({id,organization_id:organizationId,storage_path:path,mime_type:mime,name:file.name.slice(0,200),created_by:user.id});
  if(saveError){await admin.storage.from("social-studio").remove([path]);throw Error("The upload could not be saved.");}
  return NextResponse.json({id,name:file.name,mime_type:mime,purpose});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Upload failed."},{status:400})}
}
