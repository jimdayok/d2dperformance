import {NextResponse} from "next/server";import sharp from "sharp";import {z} from "zod";
import {getCurrentUser} from "@/lib/site-manager/access";import {requireProductAccess} from "@/lib/d2d-platform/access";import {loadBrand} from "@/lib/social-ai/brand";
export async function GET(request:Request){try{
 if(!await getCurrentUser())return new NextResponse(null,{status:401});
 const p=new URL(request.url).searchParams,org=z.string().uuid().parse(p.get("organization")),access=await requireProductAccess(org,"social",["manager","creator"]);
 const id=p.get("logoId")?z.string().uuid().parse(p.get("logoId")):undefined,uploaded=p.get("uploadedLogoId")?z.string().uuid().parse(p.get("uploadedLogoId")):undefined;
 const brand=await loadBrand(org,access.organizationSlug,id,uploaded);
 return new NextResponse(new Uint8Array(await sharp(brand.logo).resize({width:400,height:240,fit:"inside"}).png().toBuffer()),{headers:{"Content-Type":"image/png","Cache-Control":"private, max-age=60"}});
}catch{return new NextResponse(null,{status:404})}}
