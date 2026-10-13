import "server-only";
import {createClient} from "@supabase/supabase-js";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
export async function loadBrand(organizationId:string,organizationSlug:string,logoId?:string){
 const admin=createSupabaseAdminClient();
 const {data:entitlement}=await admin.from('product_entitlements').select('launch_url').eq('organization_id',organizationId).eq('product','brand_vault').eq('status','active').maybeSingle();
 if(!entitlement)throw Error('Connect this customer’s Brand Vault before creating branded content.');
 const path=new URL(entitlement.launch_url).pathname.match(/^\/app\/([^/]+)/);const slug=path?.[1]||organizationSlug;
 const url=process.env.BRAND_VAULT_SUPABASE_URL,key=process.env.BRAND_VAULT_SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Error('Brand Vault is not connected.');
 const vault=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:org,error}=await vault.from('organizations').select('id,name,primary_color,accent_color').eq('slug',slug).eq('status','active').maybeSingle();
 if(error||!org)throw Error('This customer’s Brand Vault could not be found.');
 const [{data:logos,error:logoError},{data:guides,error:guideError},{data:documents,error:documentError}]=await Promise.all([
  vault.from('assets').select('id,title,current_version_id').eq('organization_id',org.id).eq('asset_type','logo').eq('status','approved').order('updated_at',{ascending:false}),
  vault.from('brand_guidelines').select('id,title,description').eq('organization_id',org.id).eq('status','published'),
  vault.from('assets').select('id,title,current_version_id').eq('organization_id',org.id).eq('status','approved').eq('asset_type','document').ilike('title','%brand%').limit(5)
 ]);
 if(logoError||guideError||documentError)throw Error('Brand assets could not be read. Please try again.');
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
 return {name:org.name,logo:Buffer.from(await file.arrayBuffer()),logoTitle:selected.title,logoVersion:version.id,logos:logos??[],primaryColor:org.primary_color,accentColor:org.accent_color,guidelines:sections.data??[],pdfs,guideCount:(guides?.length??0)+pdfs.length,source:{logoAssetId:selected.id,logoVersionId:version.id,guidelineIds:guides?.map(g=>g.id)??[],documentIds:documents?.map(d=>d.id)??[]}};
}
