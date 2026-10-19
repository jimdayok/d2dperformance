import "server-only";
import {readFileSync} from "node:fs";
import {join} from "node:path";
export function socialKey(){
 if(process.env.OPENAI_API_KEY)return process.env.OPENAI_API_KEY;
 if(process.env.D2D_STUDIO_STAGING==="true"){
  try{const value=readFileSync(join(process.cwd(),".env.social-studio.local"),"utf8").trim().replace(/^OPENAI_API_KEY=/,"");if(value.startsWith("sk-"))return value;}catch{/* Not configured. */}
 }
 return undefined;
}
