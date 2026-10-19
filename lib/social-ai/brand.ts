import "server-only";
import {createClient} from "@supabase/supabase-js";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
export async function loadBrand(organizationId:string,organizationSlug:string,logoId?:string){
 const admin=createSupabaseAdminClient();
 const {data:entitlement}=await admin.from('product_entitlements').select('launch_url').eq('organization_id',organizationId).eq('product','brand_vault').eq('status','active').maybeSingle();

 const path=new URL(entitlement?.launch_url || 'https://brandvault.d2dmktg.com/app/'+organizationSlug).pathname.match(/^\/app\/([^/]+)/);const slug=path?.[1]||organizationSlug;
 const url=process.env.BRAND_VAULT_SUPABASE_URL,key=process.env.BRAND_VAULT_SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Error('Brand Vault is not connected.');
 const vault=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:org,error}=await vault.from('organizations').select('id,name,primary_color,accent_color,brand_story,tone_of_voice,brand_hashtags').eq('slug',slug).eq('status','active').maybeSingle();
 if(error||!org)throw Error('This customer’s Brand Vault could not be found.');
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
 if(!selected)throw Error('Add an approved logo in this customer’s Brand Vault first.');
 const {data:version}=await vault.from('asset_versions').select('id,storage_bucket,storage_path,mime_type,file_size_bytes').eq('organization_id',org.id).eq('id',selected.current_version_id).single();
 if(!version||!['image/png','image/jpeg','image/webp','image/svg+xml'].includes(version.mime_type)||version.file_size_bytes>10000000)throw Error('Choose a PNG, JPEG, WebP, or SVG logo smaller than 10 MB.');
 const {data:file,error:downloadError}=await vault.storage.from(version.storage_bucket).download(version.storage_path);
 if(downloadError||!file)throw Error('The selected logo could not be downloaded.');
 const sections=guides?.length?await vault.from('brand_guideline_sections').select('title,section_type,content').eq('organization_id',org.id).in('guideline_id',guides.map(g=>g.id)).order('sort_order'): {data:[],error:null};
 if(sections.error)throw Error('Published brand guidelines could not be read.');
 const pdfs:Array<{name:string;data:Buffer}>=[];
 for(const doc of documents??[]){const {data:v}=await vault.from('asset_versions').select('storage_bucket,storage_path,mime_type,file_size_bytes').eq('organization_id',org.id).eq('id',doc.current_version_id).single();if(v?.mime_type==='application/pdf'&&v.file_size_bytes<=5000000){const {data:f}=await vault.storage.from(v.storage_bucket).download(v.storage_path);if(!f)throw Error('An approved brand guide could not be downloaded.');pdfs.push({name:doc.title+'.pdf',data:Buffer.from(await f.arrayBuffer())});}}
 return {vaultSlug:slug,story:org.brand_story,voice:org.tone_of_voice,hashtags:org.brand_hashtags??[],images:imageChoices,name:org.name,logo:Buffer.from(await file.arrayBuffer()),logoTitle:selected.title,logoVersion:version.id,logos:logos??[],primaryColor:org.primary_color,accentColor:org.accent_color,guidelines:sections.data??[],pdfs,guideCount:(guides?.length??0)+pdfs.length,source:{logoAssetId:selected.id,logoVersionId:version.id,guidelineIds:guides?.map(g=>g.id)??[],documentIds:documents?.map(d=>d.id)??[]}};
}
