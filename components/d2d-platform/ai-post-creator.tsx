"use client";
import {ArrowUpRight,Sparkles} from "lucide-react";
export function AIPostCreator({organizationId}:{organizationId:string;plans:unknown[];isAdmin?:boolean}){
 return <section id="ai-create" className="portal-panel p-8"><p className="text-xs font-semibold uppercase tracking-widest text-[#9a5f34]">D2D Social Creative Studio</p><h2 className="mt-3 font-display text-3xl">A focused space to shape your next story.</h2><p className="my-4 text-sm">Develop an idea, enhance your prompt, choose brand assets and direct your scenes in the dedicated creative workspace.</p><a className="portal-primary-button inline-flex items-center gap-2 px-5 py-3" href={"/portal/marketing/studio?organization="+organizationId}><Sparkles size={17}/>Open Creative Studio<ArrowUpRight size={16}/></a></section>;
}
