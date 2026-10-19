import {createClient} from '@supabase/supabase-js';
import {setTimeout as pause} from 'node:timers/promises';
type Task={status:string;photoPath:string;prompt:string;providerId?:string;videoPath?:string};
async function main(){
 const provider=await import(new URL('../lib/social-ai/wavespeed.ts',import.meta.url).href);
 const url=process.env.SUPABASE_SERVER_URL||process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Error('Private database configuration missing.');
 const admin=createClient(url,key,{auth:{persistSession:false}});
 const save=async(id:string,values:Record<string,unknown>)=>{
  const {error}=await admin.from('social_video_jobs').update({...values,updated_at:new Date().toISOString()}).eq('id',id);
  if(error)throw Error('Video progress could not be stored.');
 };
 const read=async(path:string)=>{const {data,error}=await admin.storage.from('social-studio').download(path);if(error||!data)throw Error('Video source unavailable.');return Buffer.from(await data.arrayBuffer());};
 let stop=false;process.on('SIGTERM',()=>{stop=true});process.on('SIGINT',()=>{stop=true});
 while(!stop){
  const connected=process.env.WAVESPEED_WORKER_ENABLED==='true'&&Boolean(await provider.waveKey());
  let balance=0;
  if(connected){try{balance=await provider.checkWaveBalance()}catch{await pause(10000);continue}}
  const {error:heartbeatError}=await admin.from('social_video_worker_state').upsert({id:true,compositor_version:2,connected,balance,budget_cents:Number(process.env.WAVESPEED_STUDIO_BUDGET_CENTS||0),updated_at:new Date().toISOString()});
  if(heartbeatError)throw Error('Video service status could not be saved.');
  if(connected){
   const {data:jobs,error}=await admin.from('social_video_jobs').select('*').in('status',['queued','processing']).order('created_at').limit(1);
   if(error)throw Error('Video queue could not be loaded.');
   for(const job of jobs??[]){
    const now=new Date().toISOString(),lease=new Date(Date.now()+300000).toISOString();
    const {data:claimed,error:claimError}=await admin.from('social_video_jobs').update({lease_until:lease}).eq('id',job.id).or('lease_until.is.null,lease_until.lt.'+now).select('id').maybeSingle();
    if(claimError||!claimed)continue;
    const tasks:Task[]=job.tasks;
    try{
     if(tasks.some(t=>t.status==='submitting')){
      await save(job.id,{status:'needs_review',message:'A provider submission needs review. D2D will check its history before any retry.'});continue;
     }
     await save(job.id,{status:'processing'});
     for(const [i,t] of tasks.entries()){
      if(t.status!=='submitted')continue;
      const state=await provider.waveRequest('/predictions/'+encodeURIComponent(t.providerId!)+'/result');
      if(['failed','cancelled','timeout','deleted'].includes(state.status)){
       await save(job.id,{status:'failed',message:'WaveSpeed could not complete a shot. D2D can review it before another paid attempt.'});throw Error('Provider generation failed.');
      }
      if(state.status==='completed'){
       const bytes=await provider.downloadWaveVideo(state.outputs?.[0]),path=job.organization_id+'/animation-clips/'+job.id+'/'+i+'.mp4';
       const {error}=await admin.storage.from('social-studio').upload(path,bytes,{contentType:'video/mp4',upsert:true});if(error)throw Error('Generated shot could not be saved.');
       t.status='completed';t.videoPath=path;await save(job.id,{tasks});
      }
     }
     const completed=tasks.filter(t=>t.status==='completed').length;
     await save(job.id,{message:completed+' of 4 animated shots saved. Your video continues in the background.'});
     // Each POST is journaled before dispatch and is never automatically retried.
     // Process one video job at a time, with at most two active clips for this account.
     if(tasks.filter(t=>t.status==='submitted').length<2){
      const next=tasks.find(t=>t.status==='new');
      if(next){
       if(await provider.checkWaveBalance()<0.05){await save(job.id,{status:'failed',message:'WaveSpeed free credits are exhausted. Nothing has been purchased.'});continue;}
       const photo=await read(next.photoPath);
       next.status='submitting';await save(job.id,{tasks});
       try{
        const result=await provider.waveRequest('/'+provider.waveModel,{image:'data:image/jpeg;base64,'+photo.toString('base64'),prompt:next.prompt});
        if(!result?.id)throw Error('Missing provider receipt.');
        next.providerId=result.id;next.status='submitted';await save(job.id,{tasks});
       }catch{
        await save(job.id,{status:'needs_review',tasks,message:'The provider submission needs review. It will not be submitted twice automatically.'});continue;
       }
      }
     }
     if(tasks.every(t=>t.status==='completed')){
      await save(job.id,{message:'All four shots are ready. Adding your logo and music…'});
      const c=job.content,clips=await Promise.all(tasks.map(t=>read(t.videoPath!))),logo=await read(c.logoPath);
      const bytes=await provider.assembleWaveClips(clips,logo,{duration:20,aspect:c.aspect,music:c.direction.music,musicVolume:c.direction.musicVolume,logoTreatment:c.logoTreatment,logoPosition:c.logoPosition,scenes:c.scenes});
      const path=job.organization_id+'/generated/'+job.id+'-animation.mp4';
      const {error:uploadError}=await admin.storage.from('social-studio').upload(path,bytes,{contentType:'video/mp4',upsert:true});if(uploadError)throw Error('Finished video could not be saved.');
      const {error:mediaError}=await admin.from('social_studio_media').upsert({id:job.id,organization_id:job.organization_id,storage_path:path,name:c.topic.slice(0,150)+' · AI video',mime_type:'video/mp4',created_by:job.created_by});if(mediaError)throw Error('Finished media could not be recorded.');
      const {error:draftError}=await admin.from('social_studio_drafts').upsert({id:job.id,organization_id:job.organization_id,title:c.topic.slice(0,160),created_by:job.created_by,planned_for:c.scheduledFor??null,content:{topic:c.topic,kind:'video',logoId:c.logoId,uploadedLogoId:c.uploadedLogoId,mediaIds:[job.id],brandImageIds:[],captions:Object.fromEntries(c.platforms.map((p:string)=>[p,c.topic])),direction:{...c.direction,videoMode:'ai',aspect:c.aspect},planId:c.planId??null,source:{provider:'wavespeed',model:provider.waveModel,estimatedCostCents:20}}});if(draftError)throw Error('Video draft could not be saved.');
      await save(job.id,{status:'completed',draft_id:job.id,message:'Your 20-second AI video, logo and sound choices are saved in the content library. Nothing has been published.'});
     }
    }catch{
     // Reads, downloads and local assembly may be retried without another paid POST.
     // A journaled, unresolved POST always requires a human check instead.
     if(tasks.some(t=>t.status==='submitting'))await save(job.id,{status:'needs_review',message:'A provider submission needs review before retrying.'});
     console.error('Video worker paused job',job.id);
    }finally{
     await save(job.id,{lease_until:null});
    }
   }
  }
  await pause(10000);
 }
}
main().catch(()=>{console.error('Video worker stopped; check private server configuration.');process.exitCode=1});
