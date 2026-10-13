import {it,expect} from 'vitest';
import sharp from 'sharp';
import {renderVideo} from '../lib/social-ai/render';
import {writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
it('renders an actual twenty-second H.264 video with audio and portrait dimensions',async()=>{
 const binary=process.env.D2D_FFMPEG_PATH||join(process.cwd(),'node_modules/ffmpeg-static/ffmpeg');
 const bg=await sharp({create:{width:100,height:100,channels:3,background:'#64546a'}}).png().toBuffer();const logo=await sharp({create:{width:100,height:25,channels:4,background:'#fff'}}).png().toBuffer();
 const bytes=await renderVideo(bg,logo,['Find your audience','Answer useful questions','Make your brand clear','Meet our team'],'Schedule a meeting','#2d2022');const dir=await mkdtemp(join(tmpdir(),'d2d-video-test-'));const file=join(dir,'test.mp4');
 try{await writeFile(file,bytes);const result=await promisify(execFile)(binary,['-i',file,'-f','null','-'],{maxBuffer:2000000});expect(result.stderr).toContain('Duration: 00:00:20.00');expect(result.stderr).toContain('1080x1920');expect(result.stderr).toContain('h264');expect(result.stderr).toContain('Audio: aac');}finally{await rm(dir,{recursive:true,force:true})}
},120000);
