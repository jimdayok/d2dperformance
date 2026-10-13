import sharp from 'sharp';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
function escape(s:string){return s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));}
export function lines(text:string,max=28){const out:string[]=[];let line='';for(const word of text.split(/\s+/)){if(line&&(line+' '+word).length>max){out.push(line);line=word}else line+=(line?' ':'')+word;}if(line)out.push(line);return out;}
export async function composeGraphic(background:Buffer,logo:Buffer,headline:string,cta:string,color:string,height=1350){
 const base=await sharp(background,{limitInputPixels:25000000}).resize(1080,height,{fit:'cover'}).png().toBuffer();
 const resized=await sharp(logo,{limitInputPixels:25000000}).resize({width:330,height:110,fit:'inside',withoutEnlargement:true}).png().toBuffer();
 const raw=await sharp(resized).ensureAlpha().raw().toBuffer();let light=0,count=0;for(let i=0;i<raw.length;i+=4){if(raw[i+3]>100){light+=(raw[i]+raw[i+1]+raw[i+2])/3;count++;}}const logoPanel=count&&light/count>155?'#252024':'#fffdf9';
 const meta=await sharp(resized).metadata();const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));const foreground=rgb.reduce((a,b)=>a+b,0)/3>160?'#2d2022':'#fffdf9';const panelY=height-470;const heading=lines(headline,27).slice(0,4);const ctaLines=lines(cta,43).slice(0,2);const fontSize=heading.length>3?43:53;const lineHeight=heading.length>3?48:62;const text=Buffer.from(`<svg width="1080" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="${panelY}" width="1080" height="470" fill="${color}"/><rect x="65" y="${height-155}" width="430" height="130" rx="16" fill="${logoPanel}"/>${heading.map((l,i)=>`<text x="65" y="${panelY+70+i*lineHeight}" fill="${foreground}" font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="bold">${escape(l)}</text>`).join('')}${ctaLines.map((l,i)=>`<text x="65" y="${height-220+i*36}" fill="${foreground}" font-family="Arial,Helvetica,sans-serif" font-size="30">${escape(l)}</text>`).join('')}</svg>`);
 return sharp(base).composite([{input:text},{input:resized,left:65+Math.round((430-(meta.width??330))/2),top:height-155+Math.round((130-(meta.height??110))/2)}]).jpeg({quality:92}).toBuffer();
}
export async function renderVideo(background:Buffer,logo:Buffer,scenes:string[],cta:string,color:string){
 if(scenes.length!==4)throw Error('A video requires four scenes.');const dir=await mkdtemp(join(tmpdir(),'d2d-social-'));
 try{
  for(let i=0;i<4;i++)await writeFile(join(dir,`scene${i}.jpg`),await composeGraphic(background,logo,scenes[i],i===3?cta:'',color,1920));
  await writeFile(join(dir,'scenes.txt'),scenes.map((_,i)=>`file 'scene${i}.jpg'\nduration 5`).join('\n')+"\nfile 'scene3.jpg'\n");
  const output=join(dir,'post.mp4');const binary=process.env.D2D_FFMPEG_PATH||join(process.cwd(),'node_modules/ffmpeg-static/ffmpeg');
  await run(binary,['-y','-f','concat','-safe','0','-i',join(dir,'scenes.txt'),'-i',join(process.cwd(),'public/social-ai/original-instrumental.wav'),'-vf',"scale=1080:1920,fps=24,zoompan=z='1+0.025*mod(on,120)/120':d=1:s=1080x1920:fps=24,format=yuv420p",'-af','volume=0.15,afade=t=in:d=0.8,afade=t=out:st=18.5:d=1.5','-t','20','-r','24','-c:v','libx264','-preset','ultrafast','-crf','24','-c:a','aac','-b:a','128k','-movflags','+faststart',output],{timeout:70000,maxBuffer:2000000});
  return readFile(output);
 }finally{await rm(dir,{recursive:true,force:true})}
}
