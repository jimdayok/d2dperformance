import {NextResponse} from 'next/server';
import {z} from 'zod';
import sharp from 'sharp';
import {getCurrentUser} from '@/lib/site-manager/access';
import {requireProductAccess} from '@/lib/d2d-platform/access';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {isSameOrigin} from '@/lib/social-ai/request';
import {studioMedia,vaultPhotos} from '@/lib/social-ai/media';
import {loadBrand} from '@/lib/social-ai/brand';
import {directionSchema,directionText} from '@/lib/social-ai/direction';
import {sceneSchema,buildScenePrompts} from '@/lib/creative-studio/model';
import {wavePrompt} from '@/lib/social-ai/wavespeed';
export const runtime='nodejs';
export const maxDuration=120;
const schema=z.object({requestId:z.string().uuid(),organizationId:z.string().uuid(),topic:z.string().trim().min(8).max(2000),mediaIds:z.array(z.string().uuid()).max(4).default([]),brandImageIds:z.array(z.string().uuid()).max(4).default([]),logoId:z.string().uuid().optional(),uploadedLogoId:z.string().uuid().optional(),logoMode:z.enum(['brand','none']).default('brand'),platforms:z.array(z.enum(['facebook','instagram','linkedin'])).min(1).max(3),planId:z.string().uuid().nullable().optional(),scheduledFor:z.string().datetime().nullable().optional(),direction:directionSchema,aspect:z.enum(['landscape','portrait','square']).default('landscape'),scenes:z.array(sceneSchema).length(4).optional(),logoTreatment:z.enum(['corner','opening','opening-fade','closing','none']).default('corner'),logoPosition:z.enum(['top-right','top-left','bottom-right']).default('top-right')});
const headers={'Cache-Control':'no-store'};
export async function GET(request:Request){
 try{
  const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Sign in first.'},{status:401});
  const params=new URL(request.url).searchParams,admin=createSupabaseAdminClient();
  if(params.get('job')){
   const id=z.string().uuid().parse(params.get('job'));
   const {data:job}=await admin.from('social_video_jobs').select('id,organization_id,created_by,status,message,reserved_cents,draft_id,tasks').eq('id',id).eq('created_by',user.id).maybeSingle();
   if(!job)return NextResponse.json({error:'Video not found.'},{status:404});
   await requireProductAccess(job.organization_id,'social',['manager','creator']);
   return NextResponse.json({id:job.id,status:job.status,message:job.message,costCents:job.reserved_cents,draftId:job.draft_id,completedClips:(job.tasks??[]).filter((t:{status:string})=>t.status==='completed').length,totalClips:(job.tasks??[]).length},{headers});
  }
  const org=z.string().uuid().parse(params.get('organization'));const access=await requireProductAccess(org,'social',['manager','creator']);
  const {data:jobs,error}=await admin.from('social_video_jobs').select('reserved_cents');if(error)throw Error('Video allowance unavailable.');
  const {data:worker}=await admin.from('social_video_worker_state').select('*').eq('id',true).maybeSingle();
  const healthy=Boolean(worker?.connected&&Date.parse(worker.updated_at)>Date.now()-90000);
  const budget=worker?.budget_cents??0,reserved=(jobs??[]).reduce((n,j)=>n+j.reserved_cents,0);
  return NextResponse.json({connected:healthy,compositorReady:(worker?.compositor_version??1)>=2,workerEnabled:healthy,remainingCents:Math.max(0,budget-reserved),costCents:20,canManage:access.role==='platform_admin',privateConnection:process.env.D2D_STUDIO_STAGING==='true',message:'Four AI-animated shots, 20 seconds, 720p. Music and logo are added on the home server. No generated voice.'},{headers});
 }catch{return NextResponse.json({error:'Video details could not be loaded.'},{status:400})}
}
export async function POST(request:Request){
 if(process.env.D2D_CREATIVE_PREVIEW==="true")return NextResponse.json({error:"Paid animation is paused in this isolated preview. No provider request was submitted."},{status:403});
 let reservedId:string|undefined;
 try{
  const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Sign in first.'},{status:401});
  if(!isSameOrigin(request))return NextResponse.json({error:'Refresh and try again.'},{status:403});
  if(Number(request.headers.get('content-length'))>14000)throw Error('Please shorten the video directions.');
  const input=schema.parse(await request.json()),admin=createSupabaseAdminClient();
  const access=await requireProductAccess(input.organizationId,'social',['manager','creator']);
  const {data:existing}=await admin.from('social_video_jobs').select('id,organization_id,created_by,status').eq('id',input.requestId).maybeSingle();
  if(existing){if(existing.created_by!==user.id||existing.organization_id!==input.organizationId)throw Error('Video request unavailable.');return NextResponse.json({jobId:existing.id,status:existing.status});}
  const {data:worker}=await admin.from('social_video_worker_state').select('*').eq('id',true).maybeSingle();
  if(!worker?.connected||Date.parse(worker.updated_at)<=Date.now()-90000)throw Error('The animation service is offline. No generation was submitted.');
  if(input.direction.duration!==20)throw Error('AI animation currently creates a 20-second video.');
  if(input.scenes&&(worker.compositor_version??1)<2)throw Error('The reviewed Creative Studio compositor has not been activated. No generation was submitted.');
  const {data:limits,error:limitsError}=await admin.from('social_ai_limits').select('enabled,video_enabled').eq('organization_id',input.organizationId).maybeSingle();
  if(limitsError||!limits?.enabled||!limits.video_enabled)throw Error('AI video is paused for this client.');
  if(input.planId){
   const supabase=await createSupabaseServerClient();
   const {data:plan}=await supabase.from('marketing_plans').select('id,status,current_revision,approved_revision').eq('id',input.planId).eq('organization_id',input.organizationId).maybeSingle();
   if(!plan||plan.status!=='approved'||plan.current_revision!==plan.approved_revision)throw Error('Choose a current approved marketing plan.');
  }else if(access.role!=='platform_admin')throw Error('Choose an approved marketing plan.');
  if(!input.mediaIds.length&&!input.brandImageIds.length)throw Error('Choose one to four photos to animate.');
  const brand=await loadBrand(input.organizationId,access.organizationSlug,input.logoId,input.uploadedLogoId);
  const sources=[...await studioMedia(input.organizationId,input.mediaIds),...await vaultPhotos(brand.vaultSlug,input.brandImageIds)];
  if(sources.length<1||sources.length>4||sources.some(p=>!p.mime_type.startsWith('image/')))throw Error('Choose one to four photos. AI animation cannot use an uploaded video.');
  const balance=Number(worker.balance);if(balance<0.2)throw Error('There are not enough WaveSpeed credits. Nothing has been purchased.');
  const root=input.organizationId+'/animation-inputs/'+input.requestId;
  const photos=await Promise.all(sources.map(p=>sharp(p.bytes,{limitInputPixels:25000000}).rotate().resize({width:1500,height:1500,fit:'inside',withoutEnlargement:true}).jpeg({quality:90}).toBuffer()));
  const content={...input,photoPaths:photos.map((_,i)=>root+'/photo'+i+'.jpg'),logoPath:root+'/logo.png',createdBy:user.id};
  const {data:reservation,error:reserveError}=await admin.rpc('reserve_social_video_job',{check_id:input.requestId,check_organization:input.organizationId,check_user:user.id,check_content:content,check_cents:20,check_budget:worker.budget_cents});
  if(reserveError)throw Error(reserveError.message);
  if(reservation.existing)return NextResponse.json({jobId:reservation.id,status:reservation.status});
  reservedId=input.requestId;
  const logo=input.logoMode==='none'?await sharp({create:{width:1,height:1,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).png().toBuffer():brand.logo;
  const snapshots=[...photos.map((bytes,i)=>({path:content.photoPaths[i],bytes,mime:'image/jpeg'})),{path:content.logoPath,bytes:logo,mime:'image/png'}];
  for(const f of snapshots){const {error}=await admin.storage.from('social-studio').upload(f.path,f.bytes,{contentType:f.mime});if(error)throw Error('Video source could not be saved. No generation was submitted.');}
  const sourceIds=[...input.mediaIds,...input.brandImageIds];
  if(input.scenes?.some(scene=>scene.assetId&&!sourceIds.includes(scene.assetId)))throw Error('Choose scene reference images from this client’s selected animation sources.');
  const prompts=buildScenePrompts(input.topic,input.scenes??[],directionText(input.direction));
  const tasks=Array.from({length:4},(_,i)=>({status:'new',photoPath:content.photoPaths[input.scenes?.[i]?.assetId?sourceIds.indexOf(input.scenes[i].assetId):i%photos.length],prompt:input.scenes?prompts[i]:wavePrompt(input.topic,input.direction.notes,i)}));
  const {error}=await admin.from('social_video_jobs').update({status:'queued',tasks,message:'AI animation queued. You can leave this page; your video will be saved in the library.'}).eq('id',input.requestId);
  if(error)throw Error('The video could not be queued. No generation was submitted.');
  return NextResponse.json({jobId:input.requestId,status:'queued',costCents:20},{status:202});
 }catch(error){
  if(reservedId)await createSupabaseAdminClient().from('social_video_jobs').update({status:'failed',message:'Source preparation failed. No generation was submitted.'}).eq('id',reservedId);
  return NextResponse.json({error:error instanceof z.ZodError?'Check the video settings.':error instanceof Error?error.message:'Video could not be started.'},{status:400});
 }
}
