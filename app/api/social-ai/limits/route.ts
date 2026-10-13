import {NextResponse} from 'next/server';
import {z} from 'zod';
import {getPlatformAdminStatus,requireProductAccess} from '@/lib/d2d-platform/access';
import {getCurrentUser} from '@/lib/site-manager/access';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
const schema=z.object({organizationId:z.string().uuid(),enabled:z.boolean(),daily_limit:z.number().int().min(0).max(100),monthly_limit:z.number().int().min(0).max(1000),concurrent_limit:z.number().int().min(1).max(5),video_enabled:z.boolean()});
export async function POST(request:Request){
 try{
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Refresh and try again.'},{status:403});
 const user=await getCurrentUser();if(!user||!await getPlatformAdminStatus())return NextResponse.json({error:'Only D2D administrators can change customer limits.'},{status:403});
 const input=schema.parse(await request.json());await requireProductAccess(input.organizationId,'social',[]);
 const {organizationId,...limits}=input;const admin=createSupabaseAdminClient();
 const {error}=await admin.from('social_ai_limits').upsert({organization_id:organizationId,...limits,updated_by:user.id,updated_at:new Date().toISOString()});if(error)throw Error('Limits could not be saved.');
 const {error:auditError}=await admin.from('platform_audit_events').insert({organization_id:organizationId,actor_id:user.id,action:'social_ai.limits_updated',subject_type:'organization',subject_id:organizationId,detail:limits});if(auditError)throw Error('Limits saved, but the audit record could not be saved.');
 return NextResponse.json({message:'Customer limits saved.',limits});
 }catch(error){return NextResponse.json({error:error instanceof z.ZodError?'Choose limits within the displayed ranges.':error instanceof Error?error.message:'Limits could not be saved.'},{status:400})}
}
