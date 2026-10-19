import "server-only";
import sharp from "sharp";
import {vaultSlug} from "./brand-link";
import {studioMedia} from "./media";
import {createClient} from "@supabase/supabase-js";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
async function loadVaultBrand(organizationId:string,organizationSlug:string,logoId?:string,uploadedLogoId?:string){
 const admin=createSupabaseAdminClient();
 const {data:entitlement}=await admin.from('product_entitlements').select('launch_url').eq('organization_id',organizationId).eq('product','brand_vault').eq('status','active').maybeSingle();

 const slug=vaultSlug(organizationId,organizationSlug,entitlement?.launch_url,process.env.D2D_STUDIO_STAGING==="true");
 const url=process.env.BRAND_VAULT_SUPABASE_URL,key=process.env.BRAND_VAULT_SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Error('Brand Vault is not connected.');
 const vault=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:org,error}=await vault.from('organizations').select('id,name,primary_color,accent_color').eq('slug',slug).eq('status','active').maybeSingle();
 if(error||!org)throw Error('This customer’s Brand Vault link could not be resolved. You can upload a logo here; contact D2D to repair the Vault connection.');
 const {data:context,error:contextError}=await vault.from('organizations').select('brand_story,tone_of_voice,brand_hashtags').eq('id',org.id).maybeSingle();
 if(contextError&&!['42703','PGRST204'].includes(contextError.code))throw Error('Brand context could not be loaded.');

 const [{data:logos,error:logoError},{data:guides,error:guideError},{data:documents,error:documentError}]=await Promise.all([
  vault.from('assets').select('id,title,current_version_id').eq('organization_id',org.id).eq('asset_type','logo').eq('status','approved').order('updated_at',{ascending:false}),
  vault.from('brand_guidelines').select('id,title,description').eq('organization_id',org.id).eq('status','published'),
  vault.from('assets').select('id,title,current_version_id').eq('organization_id',org.id).eq('status','approved').eq('asset_type','document').ilike('title','%brand%').limit(5)
 ]);
 if(logoError||guideError||documentError)throw Error('Brand assets could not be read. Please try again.');
 const {data:images,error:imageError}=await vault.from('assets').select('id,title,current_version_id').eq('organization_id',org.id).eq('status','approved').eq('asset_type','image').order('updated_at',{ascending:false}).limit(60);
 if(imageError)throw Error('Brand images could not be loaded.');
 const {data:imageVersions,error:versionsError}=images?.length?await vault.from('asset_versions').select('id,storage_bucket,storage_path,mime_type,file_size_bytes').eq('organization_id',org.id).in('id',images.map(i=>i.current_version_id)):{data:[],error:null};
 if(versionsError)throw Error('Brand image versions could not be loaded.');
 const imageChoices=(await Promise.all((images??[]).map(async asset=>{
  const v=imageVersions?.find(version=>version.id===asset.current_version_id);
  if(!v||!['image/png','image/jpeg','image/webp'].includes(v.mime_type)||v.file_size_bytes>10000000)return null;
  const {data:signed}=await vault.storage.from(v.storage_bucket).createSignedUrl(v.storage_path,3600);
  return signed?{id:asset.id,title:asset.title,url:signed.signedUrl.replace(url,process.env.NEXT_PUBLIC_BRAND_VAULT_API_URL||url)}:null;
 }))).filter((image):image is {id:string;title:string;url:string}=>image!==null);
 const selected=logoId?logos?.find(x=>x.id===logoId):logos?.[0];
 if(logoId&&!selected)throw Error("Choose an approved logo from this customer's Brand Vault.");
 let logo=await sharp({create:{width:1,height:1,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).png().toBuffer();
 let logoVersion:string|null=null;
 if(uploadedLogoId){
  const [uploaded]=await studioMedia(organizationId,[uploadedLogoId]);
  if(!uploaded.mime_type.startsWith("image/")||!uploaded.storage_path.startsWith(organizationId+"/logos/"))throw Error("Choose a logo uploaded for this customer.");
  logo=uploaded.bytes;logoVersion=uploadedLogoId;
 }else if(selected){
  const {data:version}=await vault.from('asset_versions').select('id,storage_bucket,storage_path,mime_type,file_size_bytes').eq('organization_id',org.id).eq('id',selected.current_version_id).single();
  if(!version||!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(version.mime_type)||version.file_size_bytes>10000000)throw Error('Choose a PNG, JPEG, WebP, or SVG logo smaller than 10 MB.');
  const {data:file,error:downloadError}=await vault.storage.from(version.storage_bucket).download(version.storage_path);
  if(downloadError||!file)throw Error('The selected logo could not be downloaded.');
  logo=Buffer.from(await file.arrayBuffer());logoVersion=version.id;
 }
 const sections=guides?.length?await vault.from('brand_guideline_sections').select('title,section_type,content').eq('organization_id',org.id).in('guideline_id',guides.map(g=>g.id)).order('sort_order'): {data:[],error:null};
 if(sections.error)throw Error('Published brand guidelines could not be read.');
 const pdfs:Array<{name:string;data:Buffer}>=[];
 for(const doc of documents??[]){const {data:v}=await vault.from('asset_versions').select('storage_bucket,storage_path,mime_type,file_size_bytes').eq('organization_id',org.id).eq('id',doc.current_version_id).single();if(v?.mime_type==='application/pdf'&&v.file_size_bytes<=5000000){const {data:f}=await vault.storage.from(v.storage_bucket).download(v.storage_path);if(!f)throw Error('An approved brand guide could not be downloaded.');pdfs.push({name:doc.title+'.pdf',data:Buffer.from(await f.arrayBuffer())});}}
 return {connected:true,vaultSlug:slug,story:context?.brand_story??"",voice:context?.tone_of_voice??"",hashtags:context?.brand_hashtags??[],images:imageChoices,name:org.name,logo,logoTitle:uploadedLogoId?"Uploaded logo":selected?.title??"No logo selected",logoVersion,vaultUrl:"https://brandvault.d2dmktg.com/app/"+slug,warning:contextError?"Brand story fields are not available in this Vault yet. Approved logos and photos are still available.":"",logos:logos??[],primaryColor:org.primary_color,accentColor:org.accent_color,guidelines:sections.data??[],pdfs,guideCount:(guides?.length??0)+pdfs.length,source:{logoAssetId:uploadedLogoId?null:selected?.id??null,logoVersionId:logoVersion,uploadedLogoId:uploadedLogoId??null,guidelineIds:guides?.map(g=>g.id)??[],documentIds:documents?.map(d=>d.id)??[]}};
}


// Brand lookup failure must not disable uploads or local media rendering.
export async function loadBrand(organizationId:string,organizationSlug:string,logoId?:string,uploadedLogoId?:string){
 try{return await loadVaultBrand(organizationId,organizationSlug,logoId,uploadedLogoId)}
 catch(error){
  if(logoId)throw error;
  let logo=await sharp({create:{width:1,height:1,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).png().toBuffer();
  if(uploadedLogoId){
   const [uploaded]=await studioMedia(organizationId,[uploadedLogoId]);
   if(!uploaded.mime_type.startsWith("image/")||!uploaded.storage_path.startsWith(organizationId+"/logos/"))throw Error("Choose a logo uploaded for this customer.");
   logo=uploaded.bytes;
  }
  const {data:org}=await createSupabaseAdminClient().from("organizations").select("name").eq("id",organizationId).single();
  return {connected:false,vaultSlug:organizationSlug,story:"",voice:"",hashtags:[] as string[],images:[] as {id:string;title:string;url:string}[],name:org?.name??"Customer",logo,logoTitle:uploadedLogoId?"Uploaded logo":"No logo selected",logoVersion:uploadedLogoId??null,logos:[] as {id:string;title:string;current_version_id:string}[],primaryColor:"#2d2022",accentColor:"#fffdf9",guidelines:[],pdfs:[] as {name:string;data:Buffer}[],guideCount:0,vaultUrl:"https://brandvault.d2dmktg.com",warning:error instanceof Error?error.message:"Brand Vault is unavailable. Upload a logo below.",source:{logoAssetId:null,logoVersionId:uploadedLogoId??null,uploadedLogoId:uploadedLogoId??null,guidelineIds:[],documentIds:[]}};
 }
}
