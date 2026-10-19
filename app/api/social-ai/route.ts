import {socialKey} from "@/lib/social-ai/key";
import {isSameOrigin} from "@/lib/social-ai/request";
import sharp from "sharp";
import {directionSchema,directionText} from "@/lib/social-ai/direction";
import {studioMedia,vaultPhotos} from "@/lib/social-ai/media";
import {after,NextResponse} from 'next/server';
import {z} from 'zod';
import {getCurrentUser} from '@/lib/site-manager/access';
import {requireProductAccess} from '@/lib/d2d-platform/access';
import {createSupabaseAdminClient} from '@/lib/supabase/admin';
import {createSupabaseServerClient} from '@/lib/supabase/server';
import {loadBrand} from '@/lib/social-ai/brand';
import {generateCreative,prepareCreative,estimateCreative} from '@/lib/social-ai/generate';
import {defaultLimits,summarizeJobs,centralPeriodStart} from '@/lib/social-ai/usage';
import {composeGraphic,renderVideo,editUploadedVideo} from '@/lib/social-ai/render';
export const runtime='nodejs';
export const maxDuration=300;
const inputSchema=z.object({requestId:z.string().uuid(),organizationId:z.string().uuid(),planId:z.string().uuid().nullable().optional(),logoId:z.string().uuid().optional(),uploadedLogoId:z.string().uuid().optional(),topic:z.string().trim().min(8).max(2000),kind:z.enum(['graphic','video','carousel']),platforms:z.array(z.enum(['facebook','instagram','linkedin'])).min(1).max(3),scheduledFor:z.string().datetime().nullable().optional(),direction:directionSchema.default({lighting:50,energy:50,environment:50,setting:'studio',notes:'',motion:'gentle',trimStart:0,duration:20,music:"instrumental",musicVolume:15,keepOriginalAudio:1}),mediaIds:z.array(z.string().uuid()).max(12).default([]),brandImageIds:z.array(z.string().uuid()).max(12).default([]),editOnly:z.boolean().optional(),estimateOnly:z.boolean().optional()});
export async function GET(request:Request){
 try{const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Sign in first.'},{status:401});const params=new URL(request.url).searchParams;
 if(params.get('job')){const id=z.string().uuid().parse(params.get('job'));const {data:job}=await createSupabaseAdminClient().from('social_ai_jobs').select('id,organization_id,status,batch_id,message,token_estimate,copy_usage,image_usage').eq('id',id).eq('created_by',user.id).maybeSingle();if(!job)return NextResponse.json({error:'Draft not found.'},{status:404});await requireProductAccess(job.organization_id,'social',['manager','creator']);return NextResponse.json(job,{headers:{'Cache-Control':'no-store'}});}
 const org=z.string().uuid().parse(params.get('organization'));const access=await requireProductAccess(org,'social',['manager','creator']);const brand=await loadBrand(org,access.organizationSlug);const admin=createSupabaseAdminClient();const periods=centralPeriodStart();const [{data:limits,error:limitsError},{data:jobs,error:jobsError}]=await Promise.all([admin.from('social_ai_limits').select('*').eq('organization_id',org).maybeSingle(),admin.from('social_ai_jobs').select('created_at,copy_usage,image_usage,token_estimate').eq('organization_id',org).gte('created_at',periods.month)]);if(limitsError||jobsError)throw Error('Customer usage could not be loaded.');
 return NextResponse.json({brandConnected:brand.connected,brandWarning:brand.warning,vaultUrl:brand.vaultUrl,logos:brand.logos.map(l=>({id:l.id,title:l.title})),aiAvailable:Boolean(socialKey()),story:brand.story,voice:brand.voice,hashtags:brand.hashtags,images:brand.images,guideCount:brand.guideCount,logoTitle:brand.logoTitle,limits:limits??defaultLimits,usage:summarizeJobs(jobs??[],periods.day),canManage:access.role==='platform_admin'},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Brand details unavailable.'},{status:400})}
}
export async function POST(request:Request){
 try{
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:'Sign in first.'},{status:401});
 if(!isSameOrigin(request))return NextResponse.json({error:'Refresh and try again.'},{status:403});
 if(Number(request.headers.get('content-length'))>12000)return NextResponse.json({error:'Please shorten the topic.'},{status:413});
 const input=inputSchema.parse(await request.json());
 const access=await requireProductAccess(input.organizationId,'social',['manager','creator']);
 const admin=createSupabaseAdminClient(),supabase=await createSupabaseServerClient();
 const {data:existing}=await admin.from('social_ai_jobs').select('id,created_by,status,organization_id').eq('id',input.requestId).maybeSingle();if(existing){if(existing.created_by!==user.id||existing.organization_id!==input.organizationId)throw Error('Draft request not available.');return NextResponse.json({jobId:existing.id,status:existing.status});}
 let approvedPlan:unknown=null;
 if(input.planId){
  const {data:plan}=await supabase.from('marketing_plans').select('id,status,current_revision,approved_revision').eq('id',input.planId).eq('organization_id',input.organizationId).single();
  if(!plan||plan.status!=='approved'||plan.current_revision!==plan.approved_revision)throw Error('Choose a current approved marketing plan.');
  const {data:version}=await supabase.from('marketing_plan_versions').select('plan').eq('marketing_plan_id',plan.id).eq('revision',plan.current_revision).single();
  if(!version)throw Error('The approved plan could not be loaded.');approvedPlan=version.plan;
 }else if(access.role!=='platform_admin')throw Error('Choose an approved marketing plan. D2D administrators can create client examples without a plan.');
 const brand=await loadBrand(input.organizationId,access.organizationSlug,input.logoId,input.uploadedLogoId);
 const {data:limits,error:limitsError}=await admin.from('social_ai_limits').select('*').eq('organization_id',input.organizationId).maybeSingle();if(limitsError)throw Error('Customer limits could not be loaded.');
 const rules=limits??defaultLimits;if(!rules.enabled&&!input.editOnly)throw Error('AI generation is paused for this customer. Contact D2D.');if(input.kind==='video'&&!rules.video_enabled)throw Error('Video generation is disabled for this customer.');
 const uploaded=await studioMedia(input.organizationId,input.mediaIds);
 const brandPhotos=await vaultPhotos(brand.vaultSlug,input.brandImageIds);
 const sources=[...uploaded,...brandPhotos];if(sources.length>12)throw Error('Choose up to 12 media items.');
 const videos=sources.filter(m=>m.mime_type.startsWith('video/'));
 if(videos.length && (videos.length!==1||sources.length!==1||input.kind!=='video'))throw Error('Use one uploaded video by itself with the video format.');
 if(input.editOnly&&!sources.length)throw Error('Select uploaded media or an approved brand photo to edit.');
 const payload=input.editOnly?null:await prepareCreative(brand,input.topic+'\nVisual direction: '+directionText(input.direction),approvedPlan);
 if(payload)for(const photo of sources.filter(m=>m.mime_type.startsWith('image/'))){
  const thumbnail=await sharp(photo.bytes).resize({width:400,height:400,fit:'inside'}).png().toBuffer();
  payload.input[0].content.push({type:'input_image',image_url:'data:image/png;base64,'+thumbnail.toString('base64')});
 }
 const estimate=payload?await estimateCreative(payload):{copyInput:0,copyOutputAllowance:0,imageInputAllowance:0,imageOutputEstimate:0,totalAllowance:0};
 if(sources.length){estimate.imageInputAllowance=0;estimate.imageOutputEstimate=0;estimate.totalAllowance=estimate.copyInput+estimate.copyOutputAllowance;}
 if(input.estimateOnly)return NextResponse.json({estimate});
 const {data:reservation,error:reserveError}=await admin.rpc('reserve_social_ai_job',{check_id:input.requestId,check_organization:input.organizationId,check_user:user.id,check_kind:input.kind==='video'?'video':'graphic',check_sources:brand.source,check_estimate:estimate});
 if(reserveError)throw Error(reserveError.message);if(reservation.existing)return NextResponse.json({jobId:reservation.id,status:reservation.status});
 after(async()=>{try{
  if(sources.length||input.editOnly){
   const skipped={stage:'image',model:'none',usage:{total_tokens:0},reason:'Supplied media; no image API call'};
   const {error}=await admin.from('social_ai_jobs').update({image_usage:skipped,...(input.editOnly?{copy_usage:{stage:'copy',model:'none',usage:{total_tokens:0},reason:'User copy; no copy API call'}}:{})}).eq('id',input.requestId);
   if(error)throw Error('Usage status could not be saved.');
  }
  const {creative,background}=payload?await generateCreative(payload,async stage=>{const {error}=await admin.from('social_ai_jobs').update({[stage.stage==='copy'?'copy_usage':'image_usage']:stage}).eq('id',input.requestId);if(error)throw Error('API usage could not be recorded.');},sources.length?brand.logo:undefined):{creative:{title:input.topic.slice(0,160),headline:input.topic.slice(0,90),cta:'',scenes:[input.topic.slice(0,90),'','',''],color:brand.primaryColor,fontStyle:'sans' as const,captions:{facebook:input.topic,instagram:input.topic,linkedin:input.topic}},background:brand.logo};
  const photos=sources.filter(m=>m.mime_type.startsWith('image/'));
  const backgrounds=photos.length?await Promise.all(photos.map(m=>sharp(m.bytes).modulate({brightness:0.75+input.direction.lighting/200}).toBuffer())):[background];
  const outputs:Array<{bytes:Buffer;mime:string;ext:string}>=[];
  if(input.kind==='video'){
   const bytes=videos.length?await editUploadedVideo(videos[0].bytes,brand.logo,input.direction.trimStart,input.direction.duration,input.direction.lighting,input.direction.music,input.direction.musicVolume,Boolean(input.direction.keepOriginalAudio)):await renderVideo(backgrounds,brand.logo,creative.scenes,creative.cta,creative.color,creative.fontStyle,input.direction.motion,input.direction.duration,input.direction.music,input.direction.musicVolume);
   outputs.push({bytes,mime:'video/mp4',ext:'mp4'});
  }else{
   for(const photo of (input.kind==='carousel'?backgrounds:backgrounds.slice(0,1)))outputs.push({bytes:await composeGraphic(photo,brand.logo,creative.headline,creative.cta,creative.color,1350,creative.fontStyle),mime:'image/jpeg',ext:'jpg'});
  }
  const mediaIds:string[]=[];
  for(const [i,output] of outputs.entries()){
   const mediaId=crypto.randomUUID(),path=input.organizationId+'/generated/'+input.requestId+'-'+i+'.'+output.ext;
   const {error}=await admin.storage.from('social-studio').upload(path,output.bytes,{contentType:output.mime});
   if(error)throw Error('Generated media could not be stored.');
   const {error:saveError}=await admin.from('social_studio_media').insert({id:mediaId,organization_id:input.organizationId,storage_path:path,name:creative.title+' '+(i+1),mime_type:output.mime,created_by:user.id});
   if(saveError)throw Error('Generated media could not be recorded.');mediaIds.push(mediaId);
  }
  const captions=Object.fromEntries([...new Set(input.platforms)].map(p=>[p,creative.captions[p]]));
  const {data:draft,error:draftError}=await admin.from('social_studio_drafts').insert({organization_id:input.organizationId,title:creative.title,created_by:user.id,planned_for:input.scheduledFor??null,content:{logoId:input.logoId,uploadedLogoId:input.uploadedLogoId,topic:input.topic,kind:input.kind,captions,mediaIds,direction:input.direction,source:brand.source,planId:input.planId??null}}).select('id').single();
  if(draftError||!draft)throw Error('The generated draft could not be saved to the library.');
  await admin.from('social_ai_jobs').update({status:'completed',message:'Copy and media saved in your content library. Review and choose a time when ready. Nothing has been published.',updated_at:new Date().toISOString()}).eq('id',input.requestId);
 }catch(error){await admin.from('social_ai_jobs').update({status:'failed',message:error instanceof z.ZodError?'AI returned copy that did not fit the post. Please try again.':error instanceof Error?error.message:'Generation failed. Please try again.',updated_at:new Date().toISOString()}).eq('id',input.requestId);}});
 return NextResponse.json({jobId:input.requestId,status:'processing',estimate},{status:202});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'The draft could not be created.'},{status:400})}
}
