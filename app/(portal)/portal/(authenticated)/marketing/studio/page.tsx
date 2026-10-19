import {redirect} from "next/navigation";
import type {Metadata} from "next";
import {CreativeStudio} from "@/components/d2d-platform/creative-studio";
import {getProductAccess} from "@/lib/d2d-platform/access";
import {getCurrentUser} from "@/lib/site-manager/access";
import {createSupabaseServerClient} from "@/lib/supabase/server";
export const metadata:Metadata={title:"Creative Studio · D2D Social"};
export default async function CreativeStudioPage({searchParams}:{searchParams:Promise<{organization?:string}>}){
 const [query,access,user]=await Promise.all([searchParams,getProductAccess(),getCurrentUser()]);
 if(!user)redirect("/portal/login");
 const clients=access.filter(a=>a.product==="social"&&["platform_admin","manager","creator"].includes(a.role)),selected=clients.find(c=>c.organizationId===query.organization)||clients[0];
 if(!selected)redirect("/portal/marketing?notice=creator-access-required");
 const db=await createSupabaseServerClient();const {data:plans}=await db.from("marketing_plans").select("id,title,status,current_revision,approved_revision").eq("organization_id",selected.organizationId).eq("status","approved");
 return <CreativeStudio key={selected.organizationId} organizationId={selected.organizationId} organizationName={selected.organizationName} userId={user.id} clients={clients.map(c=>({id:c.organizationId,name:c.organizationName}))} plans={plans||[]} isAdmin={selected.role==="platform_admin"} previewMode={process.env.D2D_CREATIVE_PREVIEW==="true"}/>;
}
