import {NextResponse} from "next/server";
import {writeFile,rename,lstat} from "node:fs/promises";
import {join} from "node:path";
import {getPlatformAdminStatus} from "@/lib/d2d-platform/access";
import {isSameOrigin} from "@/lib/social-ai/request";
export const runtime="nodejs";
export async function POST(request:Request){
 if(process.env.D2D_STUDIO_STAGING!=="true")return NextResponse.json({error:"Not available."},{status:404});
 if(!isSameOrigin(request)||!await getPlatformAdminStatus())return NextResponse.json({error:"Administrator access is required."},{status:403});
 try{
  if(Number(request.headers.get("content-length"))>2000)throw Error("Invalid key.");
  const input=await request.json(),key=typeof input.key==="string"?input.key.trim():"";
  if(!/^sk-[A-Za-z0-9_-]{20,1500}$/.test(key))throw Error("Enter the existing OpenAI API key.");
  const check=await fetch("https://api.openai.com/v1/models",{headers:{Authorization:"Bearer "+key},signal:AbortSignal.timeout(15000)});
  if(!check.ok)throw Error("OpenAI could not validate this key. Check its access and try again.");
  const path=join(process.cwd(),".env.social-studio.local");
  try{if((await lstat(path)).isSymbolicLink())throw Error("Unsafe configuration target.");}catch(e){if((e as NodeJS.ErrnoException).code!=="ENOENT")throw e}
  const temp=path+"."+crypto.randomUUID();await writeFile(temp,"OPENAI_API_KEY="+key+"\n",{mode:0o600,flag:"wx"});await rename(temp,path);
  return NextResponse.json({message:"Existing key connected securely. It is never returned to the browser."});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Key could not be connected."},{status:400})}
}
