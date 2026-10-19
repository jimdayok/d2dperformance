import sharp from 'sharp';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
process.env.FONTCONFIG_FILE ||= join(process.cwd(),'public/social-ai/fonts.conf');
function escape(s:string){return s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));}
export function lines(text:string,max=28){const out:string[]=[];let line='';for(const word of text.split(/\s+/)){if(line&&(line+' '+word).length>max){out.push(line);line=word}else line+=(line?' ':'')+word;}if(line)out.push(line);return out;}
export async function composeGraphic(background:Buffer,logo:Buffer,headline:string,cta:string,color:string,height=1350,fontStyle:'serif'|'sans'='sans'){
 const base=await sharp(background,{limitInputPixels:25000000}).resize(1080,height,{fit:'cover'}).png().toBuffer();
 const resized=await sharp(logo,{limitInputPixels:25000000}).resize({width:330,height:110,fit:'inside',withoutEnlargement:true}).png().toBuffer();
 const raw=await sharp(resized).ensureAlpha().raw().toBuffer();let light=0,count=0;for(let i=0;i<raw.length;i+=4){if(raw[i+3]>100){light+=(raw[i]+raw[i+1]+raw[i+2])/3;count++;}}const logoPanel=count&&light/count>155?'#252024':'#fffdf9';
 const meta=await sharp(resized).metadata();const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));const foreground=rgb.reduce((a,b)=>a+b,0)/3>160?'#2d2022':'#fffdf9';const video=height>1350;const panelY=height-(video?620:470);const logoTop=video?210:80;
 const font=fontStyle==='serif'?'Cantata One':'Inter';const fontfile=join(process.cwd(),'public/social-ai/fonts',fontStyle==='serif'?'CantataOne.ttf':'Inter.ttf');
 const heading=headline.trim()?await sharp({text:{text:`<span foreground="${foreground}">${escape(headline)}</span>`,font:font+' 53',fontfile,rgba:true,width:950,dpi:72}}).resize({width:950,height:210,fit:'inside',withoutEnlargement:true}).png().toBuffer():null;
 const layers:Parameters<ReturnType<typeof sharp>['composite']>[0]=[{input:Buffer.from(`<svg width="1080" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="${panelY}" width="1080" height="${height-panelY}" fill="${color}"/>${count?`<rect x="65" y="${logoTop}" width="430" height="130" rx="16" fill="${logoPanel}"/>`:""}</svg>`)},{input:resized,left:65+Math.round((430-(meta.width??330))/2),top:logoTop+Math.round((130-(meta.height??110))/2)},...(heading?[{input:heading,left:65,top:panelY+45}]:[])];
 if(cta){const ctaImage=await sharp({text:{text:`<span foreground="${foreground}">${escape(cta)}</span>`,font:'Inter 30',fontfile:join(process.cwd(),'public/social-ai/fonts/Inter.ttf'),rgba:true,width:950,dpi:72}}).resize({width:950,height:100,fit:'inside',withoutEnlargement:true}).png().toBuffer();layers.push({input:ctaImage,left:65,top:height-(video?320:220)});}
 return sharp(base).composite(layers).jpeg({quality:92}).toBuffer();
}

export async function renderVideo(background:Buffer|Buffer[],logo:Buffer,scenes:string[],cta:string,color:string,fontStyle:'serif'|'sans'='sans',motion='gentle',duration=20,music:'none'|'instrumental'='instrumental',musicVolume=15){
 if(scenes.length!==4)throw Error('A video requires four scenes.');const dir=await mkdtemp(join(tmpdir(),'d2d-social-'));
 try{
  const backgrounds=Array.isArray(background)?background:[background];const count=Math.max(4,backgrounds.length);
  for(let i=0;i<count;i++)await writeFile(join(dir,'scene'+i+'.jpg'),await composeGraphic(backgrounds[i%backgrounds.length],logo,scenes[Math.min(3,Math.floor(i*4/count))],i===count-1?cta:'',color,1920,fontStyle));
  await writeFile(join(dir,'scenes.txt'),Array.from({length:count},(_,i)=>"file 'scene"+i+".jpg'\nduration "+duration/count).join('\n')+"\nfile 'scene"+(count-1)+".jpg'\n");
  const output=join(dir,'post.mp4');const binary=process.env.D2D_FFMPEG_PATH||join(process.cwd(),'node_modules/ffmpeg-static/ffmpeg');
  await run(binary,['-y','-f','concat','-safe','0','-i',join(dir,'scenes.txt'),...(music==='instrumental'?['-stream_loop','-1','-i',join(process.cwd(),'public/social-ai/original-instrumental.wav')]:[]),'-vf',"scale=1080:1920,fps=24,zoompan=z='1+"+(motion==='still'?0:motion==='dynamic'?0.08:0.025)+"*mod(on,120)/120':d=1:s=1080x1920:fps=24,format=yuv420p",...(music==='instrumental'?['-map','0:v:0','-map','1:a:0','-af','volume='+Math.min(100,Math.max(0,musicVolume))/100+',afade=t=in:d=0.8,afade=t=out:st='+(duration-1.5)+':d=1.5']:['-an']),'-t',String(duration),'-r','24','-c:v','libx264','-threads','2','-preset','ultrafast','-crf','24','-c:a','aac','-b:a','128k','-movflags','+faststart',output],{timeout:70000,maxBuffer:2000000});
  return readFile(output);
 }finally{await rm(dir,{recursive:true,force:true})}
}

export async function editUploadedVideo(bytes:Buffer,logo:Buffer,start:number,duration:number,lighting:number,music:'none'|'instrumental'='none',musicVolume=15,keepOriginalAudio=true){
 const dir=await mkdtemp(join(tmpdir(),'d2d-edit-'));
 try{
  const input=join(dir,'input.mp4'),mark=join(dir,'logo.png'),output=join(dir,'edited.mp4');
  await writeFile(input,bytes);
  await writeFile(mark,await sharp(logo).resize({width:280,height:100,fit:'inside'}).png().toBuffer());
  const binary=process.env.D2D_FFMPEG_PATH||join(process.cwd(),'node_modules/ffmpeg-static/ffmpeg');
  let hasAudio=false;
  try{await run(binary,['-protocol_whitelist','file,pipe','-i',input],{timeout:15000,maxBuffer:2000000})}
  catch(error){hasAudio=/Audio:/.test((error as {stderr?:string}).stderr??'')}
  const volume=Math.min(100,Math.max(0,musicVolume))/100;
  const filters=["[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,eq=brightness="+((lighting-50)/500)+"[base];[base][1:v]overlay=60:160:format=auto,format=yuv420p[out]"];
  const audioArgs:string[]=[];
  if(music==='instrumental'){
   filters.push("[2:a]volume="+volume+",afade=t=in:d=0.8,afade=t=out:st="+Math.max(0,duration-1.5)+":d=1.5[music]");
   if(keepOriginalAudio&&hasAudio){filters.push("[0:a][music]amix=inputs=2:duration=first:normalize=0[audio]");audioArgs.push('-map','[audio]')}
   else audioArgs.push('-map','[music]');
  }else if(keepOriginalAudio&&hasAudio)audioArgs.push('-map','0:a:0');
  else audioArgs.push('-an');
  await run(binary,['-y','-protocol_whitelist','file,pipe','-ss',String(start),'-i',input,'-i',mark,...(music==='instrumental'?['-stream_loop','-1','-i',join(process.cwd(),'public/social-ai/original-instrumental.wav')]:[]),'-filter_complex',filters.join(';'),'-map','[out]',...audioArgs,'-t',String(duration),'-r','24','-c:v','libx264','-threads','2','-preset','ultrafast','-crf','24','-c:a','aac','-movflags','+faststart',output],{timeout:90000,maxBuffer:2000000});
  return readFile(output);
 }finally{await rm(dir,{recursive:true,force:true})}
}
