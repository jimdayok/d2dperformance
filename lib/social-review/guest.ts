import {legacyCreative} from "./legacy";
import "server-only";
import {createHash} from "node:crypto";
import {createSupabaseAdminClient} from "@/lib/supabase/admin";
import {assertReviewWorkspace,reviewIsLive} from "./model";
export function hashReviewToken(token:string){return createHash("sha256").update(token).digest("hex");}
export async function loadGuestReview(token:string){
 assertReviewWorkspace(process.env);if(!/^[a-f0-9]{64}$/.test(token))return null;
 const live=reviewIsLive(process.env),db=createSupabaseAdminClient();
 const {data:link,error}=await db.from("social_review_links").select("id,organization_id,post_ids,expires_at,revoked_at").eq("token_hash",hashReviewToken(token)).maybeSingle();
 if(error||!link||link.revoked_at||Date.parse(link.expires_at)<=Date.now())return null;
 let query=db.from("social_review_posts").select("*").eq("organization_id",link.organization_id).in("id",link.post_ids);if(!live)query=query.eq("is_test",true);
 const [posts,activity,org]=await Promise.all([query,db.from("social_review_activity").select("id,post_id,kind,body,actor_name,created_at").eq("organization_id",link.organization_id).in("post_id",link.post_ids).order("created_at"),db.from("organizations").select("name").eq("id",link.organization_id).single()]);
 if(posts.error||activity.error||org.error)return null;
 const ids=[...new Set((posts.data??[]).flatMap(p=>p.content.mediaIds??[]))] as string[];
 const media=ids.length?await db.from("social_studio_media").select("id,name,mime_type,storage_path").eq("organization_id",link.organization_id).in("id",ids):{data:[],error:null};if(media.error)return null;
 const signed=await Promise.all((media.data??[]).map(async m=>{const {data,error}=await db.storage.from("social-studio").createSignedUrl(m.storage_path,900);if(error||!data)return null;return {id:m.id,url:data.signedUrl.replace(process.env.SUPABASE_SERVER_URL||process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_URL!),type:m.mime_type,alt:m.name};}));
 return {live,organizationId:link.organization_id,linkId:link.id,expiresAt:link.expires_at,organizationName:org.data.name,posts:(posts.data??[]).map(p=>({...p,media:p.is_test?(p.content.sampleImages||[p.content.sampleImage]).filter(Boolean).map((url:string)=>({url,type:"image/jpeg",alt:"Sample creative"})):legacyCreative(p.content).length?legacyCreative(p.content):(p.content.mediaIds??[]).flatMap((id:string)=>{const m=signed.find(x=>x?.id===id);return m?[{url:m.url,type:m.type,alt:m.alt}]:[]})})),activity:activity.data??[]};
}
