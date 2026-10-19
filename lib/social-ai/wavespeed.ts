import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import sharp from 'sharp';
export const waveModel='wavespeed-ai/wan-2.2/i2v-5b-720p';
const base='https://api.wavespeed.ai/api/v3';
export async function waveKey(){
 if(process.env.WAVESPEED_API_KEY)return process.env.WAVESPEED_API_KEY.trim();
 try{return (await readFile(/* turbopackIgnore: true */ process.env.WAVESPEED_KEY_FILE||'/run/d2d-social-secrets/wavespeed.key','utf8')).trim()}catch{return ''}
}
export async function waveRequest(path:string,body?:unknown,key?:string){
 const secret=key||await waveKey();if(!secret)throw Error('WaveSpeed is not connected.');
 const response=await fetch(base+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000),redirect:'error'});
 const data=await response.json().catch(()=>null);
 if(!response.ok||data?.code!==200)throw Error('WaveSpeed request failed ('+response.status+'). '+(body?'Check the provider history before retrying.':'Please try checking the job again.'));
 return data.data;
}
export async function checkWaveBalance(key?:string){
 const data=await waveRequest('/balance',undefined,key);if(typeof data?.balance!=='number'||!Number.isFinite(data.balance))throw Error('WaveSpeed balance could not be verified.');return data.balance as number;
}
export function wavePrompt(topic:string,notes:string,index:number){
 const shots=['gentle natural expression and blinking','a small natural head turn','a cheerful expression and subtle hand movement','a gentle friendly gesture'];
 return [topic,notes,shots[index%4],'Preserve the subject identity, age, clothing, and setting. Natural realistic motion. Stable camera. No added text.'].filter(Boolean).join('. ').slice(0,3000);
}
export function waveOutputUrl(value:unknown){
 if(typeof value!=='string')throw Error('WaveSpeed returned no video.');
 const u=new URL(value);
 if(u.protocol!=='https:'||u.port||u.username||u.password||!['.cloudfront.net','.wavespeed.ai'].some(s=>u.hostname.endsWith(s)))throw Error('WaveSpeed returned an unrecognized video host.');
 return u.href;
}
export async function downloadWaveVideo(value:unknown){
 const response=await fetch(waveOutputUrl(value),{signal:AbortSignal.timeout(120000),redirect:'error'});
 if(!response.ok||!response.body)throw Error('Generated clip could not be downloaded.');
 if(Number(response.headers.get('content-length'))>64000000)throw Error('Generated clip is too large.');
 const chunks:Buffer[]=[];let size=0;
 const reader=response.body.getReader();
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>64000000){await reader.cancel();throw Error('Generated clip is too large.')}chunks.push(Buffer.from(value));}}finally{reader.releaseLock()}
 return Buffer.concat(chunks);
}
process.env.FONTCONFIG_FILE ||= join(process.cwd(),'public/social-ai/fonts.conf');
export type CompositeOptions={duration:number;aspect:string;music:string;musicVolume:number;logoTreatment?:string;logoPosition?:string;scenes?:Array<{overlay:string;transition:string}>};
export async function assembleWaveClips(clips:Buffer[],logo:Buffer,options:CompositeOptions){
 const dir=await mkdtemp(join(tmpdir(),'d2d-wave-'));
 try{
  const size=options.aspect==='portrait'?[720,1280]:options.aspect==='square'?[720,720]:[1280,720],inputs:string[]=[],filters:string[]=[];
  for(let i=0;i<clips.length;i++){
   await writeFile(join(dir,'shot'+i+'.mp4'),clips[i]);inputs.push('-i',join(dir,'shot'+i+'.mp4'));
   const fade=options.scenes?.[i]?.transition==='fade'?',fade=t=in:st=0:d=0.2,fade=t=out:st=4.8:d=0.2':'';
   filters.push('['+i+':v]trim=duration=5,setpts=PTS-STARTPTS,scale='+size[0]+':'+size[1]+':force_original_aspect_ratio=decrease,pad='+size[0]+':'+size[1]+':(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24'+fade+'[clip'+i+']');
  }
  filters.push(clips.map((_,i)=>'[clip'+i+']').join('')+'concat=n='+clips.length+':v=1:a=0[base]');
  await writeFile(join(dir,'logo.png'),await sharp(logo,{limitInputPixels:25000000}).resize({width:220,height:90,fit:'inside'}).png().toBuffer());
  inputs.push('-loop','1','-i',join(dir,'logo.png'));
  const xy=options.logoPosition==='top-left'?'24:24':options.logoPosition==='bottom-right'?'W-w-24:H-h-24':'W-w-24:24';
  const enable=options.logoTreatment==='none'?'0':['opening','opening-fade'].includes(options.logoTreatment||'')?'lt(t,3)':options.logoTreatment==='closing'?'gte(t,'+Math.max(0,options.duration-3)+')':'1';
  if(options.logoTreatment==='opening-fade')filters.push('['+clips.length+':v]format=rgba,fade=t=in:st=0:d=0.6:alpha=1[animatedLogo]');
  filters.push('[base]'+(options.logoTreatment==='opening-fade'?'[animatedLogo]':'['+clips.length+':v]')+'overlay='+xy+':format=auto:enable=\''+enable+'\'[branded]');
  let previous='branded',nextInput=clips.length+1;
  for(const [i,scene] of (options.scenes??[]).entries()){
   if(!scene.overlay.trim())continue;
   const escaped=scene.overlay.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
   const text=await sharp({text:{text:'<span foreground="white">'+escaped+'</span>',font:'Inter 38',fontfile:join(process.cwd(),'public/social-ai/fonts/Inter.ttf'),rgba:true,width:size[0]-96,dpi:72}}).png().toBuffer();
   const panel=await sharp({create:{width:size[0]-64,height:180,channels:4,background:{r:15,g:20,b:18,alpha:0.8}}}).composite([{input:await sharp(text).resize({width:size[0]-96,height:140,fit:'inside'}).toBuffer(),gravity:'center'}]).png().toBuffer();
   const path=join(dir,'text'+i+'.png');await writeFile(path,panel);inputs.push('-loop','1','-i',path);
   const label='text'+i;filters.push('['+previous+']['+(nextInput++)+':v]overlay=(W-w)/2:H-h-44:enable=\'between(t,'+(i*5)+','+((i+1)*5-0.01)+')\'['+label+']');previous=label;
  }
  const music=options.music==='instrumental',musicInput=nextInput;
  if(music)inputs.push('-stream_loop','-1','-i',join(process.cwd(),'public/social-ai/original-instrumental.wav'));
  filters.push('['+previous+']format=yuv420p[v]');
  const output=join(dir,'video.mp4');
  await promisify(execFile)(process.env.D2D_FFMPEG_PATH||join(process.cwd(),'node_modules/ffmpeg-static/ffmpeg'),['-hide_banner','-y',...inputs,'-filter_complex_threads','1','-filter_complex',filters.join(';'),'-map','[v]',...(music?['-map',musicInput+':a:0','-af','volume='+Math.min(100,Math.max(0,options.musicVolume))/100+',afade=t=in:d=0.8,afade=t=out:st='+Math.max(0,options.duration-1.5)+':d=1.5']:['-an']),'-t',String(options.duration),'-r','24','-c:v','libx264','-threads','2','-preset','fast','-crf','22','-c:a','aac','-b:a','128k','-movflags','+faststart',output],{timeout:120000,maxBuffer:2000000});
  return await readFile(output);
 }finally{await rm(dir,{recursive:true,force:true})}
}
