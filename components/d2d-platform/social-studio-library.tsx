"use client";
import {useCallback,useEffect,useState} from "react";
export type StudioMedia={id:string;name:string;mime_type:string;purpose?:"logo"|"media";url:string|null};
export type StudioDraft={id:string;title:string;revision:number;planned_for:string|null;content:{logoId?:string;uploadedLogoId?:string;topic:string;kind:"graphic"|"video"|"carousel";captions:Record<string,string>;mediaIds:string[];brandImageIds?:string[];direction:Record<string,string|number>}};
export function centralISO(value:string){
 if(!value)return null;
 const guess=new Date(value+":00Z");
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(guess);
 const n=(key:string)=>Number(parts.find(p=>p.type===key)!.value);
 const result=new Date(guess.getTime()*2-Date.UTC(n("year"),n("month")-1,n("day"),n("hour"),n("minute")));
 const local=centralLocal(result.toISOString());if(local!==value)throw Error("That Central time does not exist. Choose another time.");
 return result.toISOString();
}
export function centralLocal(value:string){
 const p=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Chicago",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date(value));const v=(t:string)=>p.find(x=>x.type===t)?.value;
 return v("year")+"-"+v("month")+"-"+v("day")+"T"+v("hour")+":"+v("minute");
}
export function useStudio(organizationId:string){
 const [drafts,setDrafts]=useState<StudioDraft[]>([]),[media,setMedia]=useState<StudioMedia[]>([]),[error,setError]=useState("");
 const reload=useCallback(async()=>{
  try{const r=await fetch("/api/social-studio?organization="+organizationId);const d=await r.json();if(!r.ok)throw Error(d.error);setDrafts(d.drafts);setMedia(d.media);setError("");}catch(e){setError((e as Error).message)}
 },[organizationId]);
 useEffect(()=>{const timer=setTimeout(()=>void reload(),0);const fn=()=>void reload();window.addEventListener("social-studio-updated",fn);return()=>{clearTimeout(timer);window.removeEventListener("social-studio-updated",fn)}},[reload]);
 return {drafts,media,error,reload};
}
export function studioUpdated(){window.dispatchEvent(new Event("social-studio-updated"))}
export function MediaPreview({media}:{media:StudioMedia}){
 if(!media.url)return <p>Preview unavailable; refresh the library.</p>;
 return media.mime_type.startsWith("video/")?<video src={media.url} controls preload="metadata" className="max-h-72 w-full rounded-lg"/>:<img loading="lazy" src={media.url} alt={media.name} className="max-h-72 w-full rounded-lg object-contain"/>;
}
export function SocialStudioLibrary({organizationId}:{organizationId:string}){
 const {drafts,media,error}=useStudio(organizationId),[selected,setSelected]=useState<StudioDraft|null>(null),[message,setMessage]=useState(""),[busy,setBusy]=useState(false),[filter,setFilter]=useState("all");
 useEffect(()=>{const fn=(e:Event)=>{const {id,date}= (e as CustomEvent<{id:string;date:string}>).detail;const draft=drafts.find(d=>d.id===id);if(draft){setSelected({...draft,planned_for:centralISO(date+"T09:00")});document.getElementById("studio-library")?.scrollIntoView({behavior:"smooth"});setMessage("Choose a Central time, then save the planned date. This does not publish the post.");}};window.addEventListener("social-studio-drop",fn);return()=>window.removeEventListener("social-studio-drop",fn)},[drafts]);
 async function save(form:HTMLFormElement){
  if(!selected||busy)return;setBusy(true);setMessage("");
  try{const f=new FormData(form),captions=Object.fromEntries(Object.keys(selected.content.captions).map(p=>[p,String(f.get(p)??"")]));
   const response=await fetch("/api/social-studio",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({organizationId,id:selected.id,revision:selected.revision,title:f.get("title"),plannedFor:centralISO(String(f.get("plannedFor")??"")),content:{...selected.content,captions}})});
   const d=await response.json();if(!response.ok)throw Error(d.error);setMessage(d.message);setSelected(null);studioUpdated();
  }catch(e){setMessage((e as Error).message)}finally{setBusy(false)}
 }
 return <section id="studio-library" className="portal-panel scroll-mt-8 p-6">
  <p className="text-xs font-semibold uppercase tracking-wide text-[#9a5f34]">Ready when you are</p><h2 className="mt-2 font-display text-3xl">Content library</h2>
  <p className="mt-2 text-sm text-[#6d6258]">Keep ideas and finished media here without a date. Drag a draft onto the marketing calendar, or open it to choose a time. Planned drafts still need approval before delivery.</p>
  <label className="my-4 block text-sm">Show <select value={filter} onChange={e=>setFilter(e.target.value)} className="portal-field ml-2 p-2"><option value="all">All drafts</option><option value="waiting">Waiting for a date</option><option value="planned">Planned</option></select></label>
  <p role="status" className="my-3 text-sm">{error||message}</p>
  {!drafts.length&&!error?<p className="rounded-lg bg-[#f8f2e9] p-5 text-sm">Your saved ideas, uploads and generated posts will appear here.</p>:null}
  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{drafts.filter(d=>filter==="all"||(filter==="waiting"?!d.planned_for:!!d.planned_for)).map(d=><article key={d.id} draggable onDragStart={e=>{e.dataTransfer.setData("application/x-d2d-draft",d.id);e.dataTransfer.effectAllowed="move"}} className="rounded-xl border border-[#241c17]/15 bg-white p-4">
   {media.find(m=>m.id===d.content.mediaIds[0])?<MediaPreview media={media.find(m=>m.id===d.content.mediaIds[0])!}/>:null}
   {d.content.brandImageIds?.length?<p className="text-xs">{d.content.brandImageIds.length} Brand Vault photos selected</p>:null}<h3 className="mt-3 font-semibold">{d.title}</h3><p className="my-2 text-xs">{d.planned_for?"Planned: "+new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",dateStyle:"medium",timeStyle:"short"}).format(new Date(d.planned_for))+" Central":"Waiting for the right time"} · Draft</p>
   <button type="button" className="mb-3 block cursor-grab rounded border border-[#9a5f34]/30 px-3 py-2 text-xs font-semibold active:cursor-grabbing" style={{touchAction:"none"}} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);setMessage("Drag onto a calendar date, then choose a time.");}} onPointerUp={e=>{if(!e.currentTarget.hasPointerCapture(e.pointerId))return;e.currentTarget.releasePointerCapture(e.pointerId);const target=document.elementFromPoint(e.clientX,e.clientY)?.closest<HTMLElement>("[data-studio-date]");const date=target?.dataset.studioDate;if(date)window.dispatchEvent(new CustomEvent("social-studio-drop",{detail:{id:d.id,date}}));}} onClick={e=>{if(e.detail===0)setSelected(d)}}>Drag to calendar</button>
   <button type="button" className="portal-secondary-button px-3 py-2 text-sm" onClick={()=>{setSelected(d);setMessage("")}}>Open / choose time</button><button type="button" className="ml-2 text-sm underline" onClick={()=>{window.dispatchEvent(new CustomEvent("social-studio-edit",{detail:d}));document.getElementById("ai-create")?.scrollIntoView({behavior:"smooth"})}}>Use in studio</button>
  </article>)}</div>
  {selected?<form key={selected.id+selected.planned_for} onSubmit={e=>{e.preventDefault();void save(e.currentTarget)}} className="mt-6 grid gap-4 rounded-xl border border-[#9a5f34]/30 bg-[#f8f2e9] p-5">
   <h3 className="font-display text-2xl">Edit draft</h3>
   <label className="grid gap-2 text-sm">Title<input className="portal-field p-3" name="title" required maxLength={180} defaultValue={selected.title}/></label>
   <div className="grid gap-3 sm:grid-cols-2">{selected.content.mediaIds.map(id=>{const m=media.find(x=>x.id===id);return m?<MediaPreview key={id} media={m}/>:null})}</div>
   {Object.entries(selected.content.captions).map(([p,c])=><label className="grid gap-2 text-sm capitalize" key={p}>{p} caption<textarea className="portal-field p-3" name={p} defaultValue={c} maxLength={10000} rows={5}/></label>)}
   <label className="grid gap-2 text-sm">Planned date and time (Central, optional)<input className="portal-field p-3" type="datetime-local" name="plannedFor" defaultValue={selected.planned_for?centralLocal(selected.planned_for):""}/></label>
   <p className="text-xs">Clear the date to return this draft to the waiting library. Saving a planned date does not approve or publish it.</p>
   <div className="flex gap-3"><button disabled={busy} className="portal-primary-button px-4 py-3">{busy?"Saving…":"Save draft"}</button><button type="button" className="portal-secondary-button px-4 py-3" onClick={()=>setSelected(null)}>Close</button></div>
  </form>:null}
 </section>;
}
