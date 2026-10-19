import {afterEach,it,expect,vi} from 'vitest';
import {waveRequest,wavePrompt,waveOutputUrl,downloadWaveVideo,assembleWaveClips} from '../lib/social-ai/wavespeed';
import sharp from 'sharp';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
afterEach(()=>vi.unstubAllGlobals());
it('never retries a paid submission after an uncertain network failure',async()=>{
 const fetch=vi.fn().mockRejectedValue(new Error('connection lost'));vi.stubGlobal('fetch',fetch);
 await expect(waveRequest('/wavespeed-ai/wan-2.2/i2v-5b-720p',{prompt:'test'},'test-key')).rejects.toThrow('connection lost');
 expect(fetch).toHaveBeenCalledTimes(1);
 expect(fetch.mock.calls[0][1].method).toBe('POST');
});
it('rejects unexpected output hosts and oversized clips before buffering',async()=>{
 for(const url of ['http://127.0.0.1/private','https://cloudfront.net.evil.test/file','https://user:pass@x.cloudfront.net/file','https://x.cloudfront.net:8443/file'])expect(()=>waveOutputUrl(url)).toThrow();
 expect(waveOutputUrl('https://abc.cloudfront.net/clip.mp4')).toContain('abc.cloudfront.net');
 const fetch=vi.fn().mockResolvedValue(new Response('x',{headers:{'content-length':'65000000'}}));vi.stubGlobal('fetch',fetch);
 await expect(downloadWaveVideo('https://abc.cloudfront.net/clip.mp4')).rejects.toThrow('too large');
});
it('keeps the subject and creates distinct motion directions without inventing voice',()=>{
 const prompts=Array.from({length:4},(_,i)=>wavePrompt('Baby smiles','gentle movement',i));
 expect(new Set(prompts).size).toBe(4);expect(prompts.every(p=>p.includes('Preserve the subject identity, age'))).toBe(true);
});
it('assembles exact 20-second 720p videos with selected logo, optional music and no extra provider calls',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'wave-test-')),binary=join(process.cwd(),'node_modules/ffmpeg-static/ffmpeg');
 try{
  const source=join(dir,'source.mp4');
  await promisify(execFile)(binary,['-hide_banner','-loglevel','error','-f','lavfi','-i','color=c=blue:s=160x120:r=24:d=5.041667','-c:v','libx264','-threads','1','-pix_fmt','yuv420p','-y',source]);
  const clips=Array(4).fill(await readFile(source)),logo=await sharp({create:{width:100,height:30,channels:4,background:'#ff0000'}}).png().toBuffer();
  const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
  const video=await assembleWaveClips(clips,logo,{duration:20,aspect:'landscape',music:'instrumental',musicVolume:15}),out=join(dir,'out.mp4');await writeFile(out,video);
  const info=(await promisify(execFile)(binary,['-i',out,'-f','null','-'],{maxBuffer:2000000})).stderr;
  expect(info).toContain('Duration: 00:00:20.00');expect(info).toContain('1280x720');expect(info).toContain('Audio: aac');
  const frame=join(dir,'frame.png');await promisify(execFile)(binary,['-loglevel','error','-i',out,'-frames:v','1','-y',frame]);
  const pixel=await sharp(frame).extract({left:1100,top:40,width:1,height:1}).raw().toBuffer();expect(pixel[0]).toBeGreaterThan(200);expect(pixel[2]).toBeLessThan(50);
  const silent=await assembleWaveClips(clips,logo,{duration:20,aspect:'portrait',music:'none',musicVolume:0});await writeFile(out,silent);
  const silentInfo=(await promisify(execFile)(binary,['-i',out,'-f','null','-'],{maxBuffer:2000000})).stderr;expect(silentInfo).toContain('720x1280');expect(silentInfo).not.toContain('Audio:');
  expect(fetch).not.toHaveBeenCalled();
 }finally{await rm(dir,{recursive:true,force:true})}
},120000);
