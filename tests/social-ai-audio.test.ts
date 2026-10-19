import {it,expect} from "vitest";
import sharp from "sharp";
import {renderVideo,editUploadedVideo} from "../lib/social-ai/render";
import {writeFile,mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
const binary=process.env.D2D_FFMPEG_PATH||join(process.cwd(),"node_modules/ffmpeg-static/ffmpeg");
async function inspect(bytes:Buffer){
 const dir=await mkdtemp(join(tmpdir(),"d2d-audio-test-")),file=join(dir,"output.mp4");
 try{await writeFile(file,bytes);return (await promisify(execFile)(binary,["-i",file,"-f","null","-"],{maxBuffer:2000000})).stderr}
 finally{await rm(dir,{recursive:true,force:true})}
}
it("renders a silent photo video, then adds music to an uploaded silent clip",async()=>{
 const photo=await sharp({create:{width:100,height:100,channels:3,background:"#64546a"}}).png().toBuffer();
 const logo=await sharp({create:{width:100,height:25,channels:4,background:"#ffffff"}}).png().toBuffer();
 const silent=await renderVideo([photo,photo],logo,["One","Two","Three","Four"],"","#2d2022","sans","still",5,"none",0);
 const silentInfo=await inspect(silent);expect(silentInfo).toContain("Duration: 00:00:05.00");expect(silentInfo).not.toContain("Audio:");
 const music=await editUploadedVideo(silent,logo,0,5,50,"instrumental",20,true);
 expect(await inspect(music)).toContain("Audio: aac");
 const muted=await editUploadedVideo(music,logo,0,5,50,"none",0,false);
 expect(await inspect(muted)).not.toContain("Audio:");
 const mixed=await editUploadedVideo(music,logo,0,5,50,"instrumental",10,true);
 expect(await inspect(mixed)).toContain("Audio: aac");
},180000);
