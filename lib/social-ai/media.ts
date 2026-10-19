import "server-only";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
import {createClient} from "@supabase/supabase-js";
export async function studioMedia(organizationId:string,ids:string[]){
 const admin=createSupabaseAdminClient();
 if(!ids.length)return [];
 const {data,error}=await admin.from("social_studio_media").select("*").eq("organization_id",organizationId).in("id",ids);
 if(error||data?.length!==new Set(ids).size)throw Error("Choose media from this client's library.");
 return Promise.all(ids.map(async id=>{
  const row=data!.find(m=>m.id===id)!;
  const {data:file,error}=await admin.storage.from("social-studio").download(row.storage_path);
  if(error||!file)throw Error("Selected media could not be downloaded.");
  return {...row,bytes:Buffer.from(await file.arrayBuffer())};
 }));
}
export async function vaultPhotos(organizationSlug:string,ids:string[]){
 if(!ids.length)return [];
 const vault=createClient(process.env.BRAND_VAULT_SUPABASE_URL!,process.env.BRAND_VAULT_SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}});
 const {data:org}=await vault.from("organizations").select("id").eq("slug",organizationSlug).eq("status","active").single();
 if(!org)throw Error("Brand Vault could not be found.");
 const {data:assets,error}=await vault.from("assets").select("id,current_version_id").eq("organization_id",org.id).eq("status","approved").eq("asset_type","image").in("id",ids);
 if(error||assets?.length!==new Set(ids).size)throw Error("Choose approved images from this customer's Brand Vault.");
 return Promise.all(ids.map(async id=>{
  const asset=assets!.find(a=>a.id===id)!;
  const {data:v}=await vault.from("asset_versions").select("storage_bucket,storage_path,mime_type,file_size_bytes").eq("organization_id",org.id).eq("id",asset.current_version_id).single();
  if(!v||!["image/jpeg","image/png","image/webp"].includes(v.mime_type)||v.file_size_bytes>10000000)throw Error("Choose a brand photo up to 10 MB.");
  const {data:file}=await vault.storage.from(v.storage_bucket).download(v.storage_path);
  if(!file)throw Error("Brand photo could not be downloaded.");
  return {bytes:Buffer.from(await file.arrayBuffer()),mime_type:v.mime_type};
 }));
}
