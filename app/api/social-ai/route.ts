import {after,NextResponse} from 'next/server';
import {z} from 'zod';
import {getCurrentUser} from '@/lib/site-manager/access';
import {requireProductAccess} from '@/lib/d2d-platform/access';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {loadBrand} from '@/lib/social-ai/brand';
import {generateCreative} from '@/lib/social-ai/generate';
import {composeGraphic,renderVideo} from '@/lib/social-ai/render';
export const runtime='nodejs';
export const maxDuration=300;
const inputSchema=z.object({requestId:z.string().uuid(),organizationId:z.string().uuid(),planId:z.string().uuid(),logoId:z.string().uuid().optional(),topic:z.string().trim().min(8).max(2000),kind:z.enum(['graphic','video']),platforms:z.array(z.enum(['facebook','instagram','linkedin'])).min(1).max(3),scheduledFor:z.string().datetime()});
export async function GET(request:Request){
 try{const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Sign in first.'},{status:401});const params=new URL(request.url).searchParams;
 if(params.get('job')){const id=z.string().uuid().parse(params.get('job'));const {data:job}=await createSupabaseAdminClient().from('social_ai_jobs').select('id,organization_id,status,batch_id,message').eq('id',id).eq('created_by',user.id).maybeSingle();if(!job)return NextResponse.json({error:'Draft not found.'},{status:404});await requireProductAccess(job.organization_id,'social',['manager','creator']);return NextResponse.json(job,{headers:{'Cache-Control':'no-store'}});}
 const org=z.string().uuid().parse(params.get('organization'));const access=await requireProductAccess(org,'social',['manager','creator']);const brand=await loadBrand(org,access.organizationSlug);
 return NextResponse.json({logos:brand.logos.map(l=>({id:l.id,title:l.title})),guideCount:brand.guideCount,logoTitle:brand.logoTitle},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Brand details unavailable.'},{status:400})}
}
export async function POST(request:Request){
 try{
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Sign in first.'},{status:401});
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Refresh and try again.'},{status:403});
 if(Number(request.headers.get('content-length'))>12000)return NextResponse.json({error:'Please shorten the topic.'},{status:413});
 const input=inputSchema.parse(await request.json());if(Date.parse(input.scheduledFor)<Date.now()+60000)throw Error('Choose a future planned publish time.');
 const access=await requireProductAccess(input.organizationId,'social',['manager','creator']);
 const admin=createSupabaseAdminClient(),supabase=await createSupabaseServerClient();
 const {data:existing}=await admin.from('social_ai_jobs').select('id,created_by,status').eq('id',input.requestId).maybeSingle();if(existing){if(existing.created_by!==user.id)throw Error('Draft request not available.');return NextResponse.json({jobId:existing.id,status:existing.status});}
 const {count}=await admin.from('social_ai_jobs').select('id',{count:'exact',head:true}).eq('created_by',user.id).gte('created_at',new Date(Date.now()-86400000).toISOString());if((count??0)>=20)throw Error('The daily generation limit is reached. Try again tomorrow.');
 const {data:plan}=await supabase.from('marketing_plans').select('id,status,current_revision,approved_revision').eq('id',input.planId).eq('organization_id',input.organizationId).single();
 if(!plan||plan.status!=='approved'||plan.current_revision!==plan.approved_revision)throw Error('Choose a current approved marketing plan.');
 const {data:version}=await supabase.from('marketing_plan_versions').select('plan').eq('marketing_plan_id',plan.id).eq('revision',plan.current_revision).single();if(!version)throw Error('The approved plan could not be loaded.');
 const brand=await loadBrand(input.organizationId,access.organizationSlug,input.logoId);
 const {error:insertError}=await admin.from('social_ai_jobs').insert({id:input.requestId,organization_id:input.organizationId,created_by:user.id,status:'processing',brand_sources:brand.source});if(insertError)throw Error('The draft request could not be saved.');
 after(async()=>{try{
  const {creative,background}=await generateCreative(brand,input.topic,version.plan);
  const bytes=input.kind==='video'?await renderVideo(background,brand.logo,creative.scenes,creative.cta,creative.color):await composeGraphic(background,brand.logo,creative.headline,creative.cta,creative.color);
  const bucket='d2d-social-campaigns',path=`${input.organizationId}/ai/${input.requestId}.${input.kind==='video'?'mp4':'jpg'}`;
  const {error:uploadError}=await admin.storage.from(bucket).upload(path,bytes,{contentType:input.kind==='video'?'video/mp4':'image/jpeg',upsert:false});if(uploadError)throw Error('Generated media could not be saved.');
  const {data:{publicUrl}}=admin.storage.from(bucket).getPublicUrl(path);
  const captions=Object.fromEntries([...new Set(input.platforms)].map(p=>[p,creative.captions[p]]));
  const {data:batch,error:batchError}=await supabase.rpc('create_manual_social_batch',{check_organization:input.organizationId,check_marketing_plan:input.planId,check_title:creative.title,check_scheduled_for:input.scheduledFor,check_captions:captions,check_media:[{url:publicUrl,altText:creative.headline}]});if(batchError||!batch?.id)throw Error(batchError?.message||'The generated approval draft could not be saved.');
  const {error:reviewError}=await supabase.rpc('submit_social_batch_for_client_review',{check_batch:batch.id});if(reviewError)throw Error('The draft was saved but could not enter customer review.');
  await admin.from('social_ai_jobs').update({status:'completed',batch_id:batch.id,message:'Copy and media saved for approval.',updated_at:new Date().toISOString()}).eq('id',input.requestId);
 }catch(error){await admin.from('social_ai_jobs').update({status:'failed',message:error instanceof Error?error.message:'Generation failed. Please try again.',updated_at:new Date().toISOString()}).eq('id',input.requestId);}});
 return NextResponse.json({jobId:input.requestId,status:'processing'},{status:202});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'The draft could not be created.'},{status:400})}
}
