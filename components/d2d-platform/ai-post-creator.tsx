"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import {AICustomerLimits,type AILimits} from "./ai-customer-limits";
import {centralISO,MediaPreview,studioUpdated,useStudio,type StudioDraft} from "./social-studio-library";
type Plan={id:string;title:string;status:string;current_revision:number;approved_revision:number|null};
type Brand={aiAvailable:boolean;logos:Array<{id:string;title:string}>;images:Array<{id:string;title:string;url:string}>;story:string;voice:string;hashtags:string[];guideCount:number;canManage:boolean;limits:AILimits;usage:{dayRequests:number;monthRequests:number;reportedTokens:number;unreportedJobs:number;mediaEdits?:number}};
export function AIPostCreator({organizationId,plans,isAdmin=false}:{organizationId:string;plans:Plan[];isAdmin?:boolean}){
 const {media,error:libraryError}=useStudio(organizationId);
 const [brand,setBrand]=useState<Brand|null>(null),[message,setMessage]=useState("Loading brand context…"),[busy,setBusy]=useState(false),[job,setJob]=useState(""),[kind,setKind]=useState("graphic"),[estimate,setEstimate]=useState<number|null>(null);
 const [lighting,setLighting]=useState(50),[energy,setEnergy]=useState(50),[environment,setEnvironment]=useState(50),[mediaIds,setMediaIds]=useState<string[]>([]),[brandIds,setBrandIds]=useState<string[]>([]);
 const formRef=useRef<HTMLFormElement>(null);
 const requestId=useRef(""),approved=plans.filter(p=>p.status==="approved"&&p.current_revision===p.approved_revision);
 useEffect(()=>{let live=true;fetch("/api/social-ai?organization="+organizationId).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);if(live){setBrand(d);setMessage("")}}).catch(e=>{if(live)setMessage(e.message)});return()=>{live=false}},[organizationId]);
 useEffect(()=>{const timer=setTimeout(()=>{const saved=sessionStorage.getItem("social-job-"+organizationId);if(saved){setJob(saved);setBusy(true)}},0);return()=>clearTimeout(timer)},[organizationId]);
 useEffect(()=>{
  if(!job)return;let live=true;
  const poll=async()=>{try{const r=await fetch("/api/social-ai?job="+job);const d=await r.json();if(!r.ok)throw Error(d.error);if(!live)return;setMessage(d.message||"Creating copy and media…");if(["completed","failed"].includes(d.status)){setBusy(false);setJob("");requestId.current="";sessionStorage.removeItem("social-job-"+organizationId);studioUpdated();fetch("/api/social-ai?organization="+organizationId).then(r=>r.json()).then(next=>{if(live&&next.limits)setBrand(next)}).catch(()=>{})}}catch(e){if(live)setMessage((e as Error).message+" Your request is saved; refresh to check it.")}};
  void poll();const timer=setInterval(()=>void poll(),3000);return()=>{live=false;clearInterval(timer)};
 },[job,organizationId]);
 useEffect(()=>{
  const fn=(event:Event)=>{
   if(busy)return;const draft=(event as CustomEvent<StudioDraft>).detail,d=draft.content.direction;
   setKind(draft.content.kind);setMediaIds(draft.content.mediaIds);setBrandIds(draft.content.brandImageIds??[]);
   setLighting(Number(d.lighting??50));setEnergy(Number(d.energy??50));setEnvironment(Number(d.environment??50));
   const form=formRef.current;if(form){
    for(const [name,value] of Object.entries({topic:draft.content.topic,...d})){
     const field=form.elements.namedItem(name);if(field instanceof HTMLInputElement||field instanceof HTMLTextAreaElement||field instanceof HTMLSelectElement)field.value=String(value);
    }
   }
   requestId.current="";setMessage("Draft loaded. Your next save creates another version in the library.");
  };
  window.addEventListener("social-studio-edit",fn);return()=>window.removeEventListener("social-studio-edit",fn);
 },[busy]);
 async function upload(files:FileList|null){
  if(!files||busy)return;setBusy(true);
  try{const added:string[]=[];for(const file of Array.from(files)){setMessage("Uploading "+file.name+"…");const f=new FormData();f.set("organizationId",organizationId);f.set("file",file);const r=await fetch("/api/social-studio/upload",{method:"POST",body:f});const d=await r.json();if(!r.ok)throw Error(d.error);added.push(d.id);studioUpdated()}setMediaIds(ids=>[...ids,...added].slice(0,Math.max(0,12-brandIds.length)));setMessage("Uploads saved. Select a format and guide the edit below.");}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}
 }
 function payload(form:HTMLFormElement){
  const d=new FormData(form);
  return {organizationId,requestId:requestId.current,topic:d.get("topic"),kind,logoId:d.get("logoId")||undefined,planId:d.get("planId")||null,platforms:d.getAll("platforms"),scheduledFor:centralISO(String(d.get("scheduledFor")??"")),mediaIds,brandImageIds:brandIds,direction:{lighting,energy,environment,setting:d.get("setting"),notes:d.get("notes"),motion:d.get("motion"),trimStart:Number(d.get("trimStart")||0),duration:Number(d.get("duration")||20)}};
 }
 async function run(form:HTMLFormElement,mode:"estimate"|"generate"|"save"|"edit"){
  if(busy||!form.reportValidity())return;
  if(!requestId.current)requestId.current=crypto.randomUUID();setBusy(true);setMessage(mode==="save"?"Saving idea…":"Preparing your draft…");
  try{const p=payload(form);if(!p.platforms.length)throw Error("Choose at least one platform.");
   const r=await fetch(mode==="save"?"/api/social-studio":"/api/social-ai",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(mode==="save"?{organizationId,title:String(p.topic).slice(0,160),plannedFor:p.scheduledFor,content:{topic:p.topic,kind,captions:Object.fromEntries(p.platforms.map(platform=>[platform,p.topic])),mediaIds,brandImageIds:brandIds,direction:p.direction}}:{...p,estimateOnly:mode==="estimate",editOnly:mode==="edit"})});
   const d=await r.json();if(!r.ok)throw Error(d.error);
   if(mode==="generate"||mode==="edit"){setJob(d.jobId);sessionStorage.setItem("social-job-"+organizationId,d.jobId)}
   else {setBusy(false);setMessage(mode==="estimate"?"Estimated allowance: "+d.estimate.totalAllowance.toLocaleString()+" tokens.":"Idea saved in your content library.");if(d.estimate)setEstimate(d.estimate.totalAllowance);else{requestId.current="";studioUpdated()}}
  }catch(e){setBusy(false);setMessage((e as Error).message)}
 }
 async function connectKey(form:HTMLFormElement){
  setBusy(true);try{const f=new FormData(form),r=await fetch("/api/social-ai/key",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({key:f.get("existingKey")})});const d=await r.json();if(!r.ok)throw Error(d.error);form.reset();setMessage(d.message);if(brand)setBrand({...brand,aiAvailable:true})}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}
 }
 const toggle=(id:string,ids:string[],set:(ids:string[])=>void)=>{if(!ids.includes(id)&&mediaIds.length+brandIds.length>=12){setMessage("Choose up to 12 photos in total.");return}set(ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);setEstimate(null)};
 return <section id="ai-create" className="portal-panel p-6">
  <p className="text-xs font-semibold uppercase tracking-wide text-[#9a5f34]">D2D Social creative studio</p><h2 className="mt-2 font-display text-3xl">Direct the story. Shape the scene.</h2>
  <p className="mt-2 text-sm text-[#6d6258]">Start with your brand, add photos or video, and guide the look like a filmmaker. Save an idea now or create finished media for review.</p>
  {brand?<div className="my-5 rounded-xl bg-[#f8f2e9] p-4 text-sm">
   <p className="font-semibold">Brand Vault connected · {brand.guideCount} guides · {brand.logos.length} logos · {brand.images.length} photos</p>
   <details className="mt-3"><summary className="cursor-pointer">Brand story, tone of voice and hashtags</summary><p className="mt-3 whitespace-pre-wrap"><strong>Story:</strong> {brand.story||"No brand story saved yet."}</p><p className="mt-3 whitespace-pre-wrap"><strong>Voice:</strong> {brand.voice||"Published voice and messaging guidelines will be used when available."}</p><p className="mt-3"><strong>Hashtags:</strong> {brand.hashtags.join(" ")||"No brand hashtags saved yet."}</p><a className="mt-3 inline-block underline" href={process.env.NEXT_PUBLIC_BRAND_VAULT_URL||"https://brandvault.d2dmktg.com"} target="_blank" rel="noreferrer">Edit in Brand Vault</a></details>
   <p className="mt-3 text-xs">{brand.usage.dayRequests} / {brand.limits.daily_limit} AI drafts today · {brand.usage.monthRequests} / {brand.limits.monthly_limit} AI drafts this month · {brand.usage.reportedTokens.toLocaleString()} reported tokens</p>
   {brand.usage.mediaEdits?<p className="mt-1 text-xs">{brand.usage.mediaEdits} media edits this month used no OpenAI tokens.</p>:null}{brand.usage.unreportedJobs>0?<p className="text-xs">{brand.usage.unreportedJobs} attempts have incomplete usage reporting.</p>:null}
   {!brand.aiAvailable?<p className="mt-3 text-sm">AI copy and image generation needs the existing D2D Social key connected to this staging environment. Uploads, editing and the content library are available.</p>:null}{brand.canManage?<AICustomerLimits organizationId={organizationId} limits={brand.limits} onSaved={limits=>setBrand({...brand,limits})}/>:null}
  </div>:null}
  {brand?.canManage&&!brand.aiAvailable?<details className="my-4 rounded-lg border p-4"><summary className="cursor-pointer text-sm font-semibold">Connect the existing D2D Social key for private staging</summary><form onSubmit={e=>{e.preventDefault();void connectKey(e.currentTarget)}} className="mt-3 flex flex-wrap gap-3"><label className="grid gap-2 text-sm">Existing OpenAI key<input name="existingKey" type="password" autoComplete="off" required className="portal-field p-3"/></label><button disabled={busy} className="portal-secondary-button px-4 py-3">Connect existing key</button></form><p className="mt-3 text-xs">Saved only on the home server. Use the existing D2D Social key; no new key or subscription is created.</p></details>:null}
  <form ref={formRef} onChange={()=>{setEstimate(null);if(!job)requestId.current=""}} onSubmit={(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();void run(e.currentTarget,"generate")}} className="mt-5 grid gap-5 sm:grid-cols-2">
   <label className="grid gap-2 text-sm sm:col-span-2">What story are we telling?<textarea className="portal-field p-3" name="topic" required minLength={8} maxLength={2000} rows={3} placeholder="Audience, message, confirmed details and what viewers should do next"/></label>
   <label className="grid gap-2 text-sm">Format<select value={kind} onChange={e=>setKind(e.target.value)} className="portal-field p-3"><option value="graphic">Single graphic</option><option value="carousel">Multiple photos / carousel</option><option value="video" disabled={brand?!brand.limits.video_enabled:false}>Photo motion or uploaded video</option></select></label>
   <label className="grid gap-2 text-sm">Brand logo<select name="logoId" className="portal-field p-3">{brand?.logos.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></label>
   <div className="sm:col-span-2 rounded-xl border border-dashed border-[#9a5f34]/40 p-5"><label className="grid gap-2 text-sm font-semibold">Upload photos or video<input disabled={busy} type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" onChange={e=>{void upload(e.target.files);e.target.value=""}}/></label><p className="mt-2 text-xs">Photos up to 10 MB; MP4 or MOV up to 100 MB. Select up to 12 photos in playback order, or one video. Originals stay in your media library.</p></div>
   <details className="sm:col-span-2 rounded-lg border p-4"><summary className="cursor-pointer text-sm font-semibold">Choose from media library ({mediaIds.length} selected)</summary><fieldset className="mt-4"><legend className="mb-3 text-sm font-semibold">Media library</legend><div className="grid gap-3 sm:grid-cols-3">{media.map(m=><label key={m.id} className="rounded-lg border p-3"><MediaPreview media={m}/><span className="mt-2 flex gap-2 text-xs"><input type="checkbox" checked={mediaIds.includes(m.id)} onChange={()=>toggle(m.id,mediaIds,setMediaIds)}/>{mediaIds.includes(m.id)?String(mediaIds.indexOf(m.id)+1)+". ":""}{m.name}</span></label>)}</div>{!media.length?<p className="text-xs text-[#6d6258]">Upload media above, choose a brand photo below, or generate an illustrative background.</p>:null}</fieldset></details>
   {brand?.images.length?<details className="sm:col-span-2 rounded-lg border p-4"><summary className="cursor-pointer text-sm font-semibold">Choose Brand Vault photos ({brandIds.length} selected)</summary><fieldset className="mt-4"><legend className="mb-3 text-sm font-semibold">Approved Brand Vault photos</legend><div className="grid gap-3 sm:grid-cols-4">{brand.images.map(m=><label key={m.id} className="rounded-lg border p-3"><img loading="lazy" src={m.url} alt={m.title} className="h-32 w-full object-contain"/><span className="mt-2 flex gap-2 text-xs"><input type="checkbox" checked={brandIds.includes(m.id)} onChange={()=>toggle(m.id,brandIds,setBrandIds)}/>{m.title}</span></label>)}</div></fieldset></details>:null}
   <fieldset className="sm:col-span-2 grid gap-5 rounded-xl bg-[#171f1b] p-5 text-white"><legend className="rounded-lg bg-[#171f1b] px-2 text-sm font-semibold">Set the scene</legend>
    {([["Lighting","Dark & moody","Light & airy",lighting,setLighting],["Energy","Quiet & calm","Bold & exciting",energy,setEnergy],["Time of day","Nighttime / bright lights","Bright daylight",environment,setEnvironment]] as const).map(([name,left,right,value,set])=><label key={name} className="grid gap-2 text-sm">{name}<input aria-label={name} type="range" min={0} max={100} value={value} onChange={e=>set(Number(e.target.value))} className="w-full accent-[#d6a77f]"/><span className="flex justify-between gap-4 text-xs text-white/70"><span>{left}</span><span>{right}</span></span></label>)}
    <label className="grid gap-2 text-sm">Where does the story happen?<select name="setting" className="portal-field p-3 text-[#241c17]"><option value="studio">Studio</option><option value="outdoors">Outdoors</option><option value="nightlife">Nightlife / city lights</option><option value="workplace">At work</option><option value="customer-location">At the client&apos;s location</option></select></label>
    <label className="grid gap-2 text-sm">How should the camera feel?<select name="motion" className="portal-field p-3 text-[#241c17]"><option value="gentle">Gentle movement</option><option value="dynamic">More energetic movement</option><option value="still">Still frames</option></select></label>
    <label className="grid gap-2 text-sm">Director&apos;s notes<textarea name="notes" maxLength={1500} className="portal-field p-3 text-[#241c17]" rows={2} placeholder="What should the viewer feel? What should the edit emphasize or avoid?"/></label>
    <p className="text-xs text-white/70">Scene choices guide generated backgrounds and copy. Existing photos receive crop, light and brand treatment. Uploaded video keeps its scene and receives trim, portrait crop, light adjustment and logo.</p>
   </fieldset>
   {kind==="video"?<><label className="grid gap-2 text-sm">Start uploaded video at (seconds)<input type="number" name="trimStart" min={0} max={3600} defaultValue={0} className="portal-field p-3"/></label><label className="grid gap-2 text-sm">Video length (seconds)<input type="number" name="duration" min={5} max={30} defaultValue={20} className="portal-field p-3"/></label></>:null}
   <label className="grid gap-2 text-sm">Marketing plan<select name="planId" required={!isAdmin} className="portal-field p-3">{isAdmin?<option value="">Client example / no approved plan</option>:null}{approved.map(p=><option value={p.id} key={p.id}>{p.title}</option>)}</select></label>
   <label className="grid gap-2 text-sm">Planned time (Central, optional)<input type="datetime-local" name="scheduledFor" className="portal-field p-3"/><span className="text-xs">Leave blank to keep it in the content library.</span></label>
   <fieldset className="flex flex-wrap gap-4 text-sm sm:col-span-2"><legend className="mb-2">Platforms</legend>{["facebook","instagram","linkedin"].map(p=><label key={p} className="flex gap-2 capitalize"><input type="checkbox" name="platforms" value={p} defaultChecked={p!=="linkedin"}/>{p}</label>)}</fieldset>
   <div className="flex flex-wrap gap-3 sm:col-span-2"><button type="button" disabled={busy} className="portal-secondary-button p-3" onClick={e=>{if(e.currentTarget.form)void run(e.currentTarget.form,"save")}}>Save idea / uploaded media</button><button type="button" disabled={busy||!brand?.aiAvailable} className="portal-secondary-button p-3" onClick={e=>{if(e.currentTarget.form)void run(e.currentTarget.form,"estimate")}}>Estimate tokens</button><button type="button" disabled={busy||!brand||(!mediaIds.length&&!brandIds.length)} className="portal-secondary-button p-3" onClick={e=>{if(e.currentTarget.form)void run(e.currentTarget.form,"edit")}}>Edit selected media</button><button disabled={busy||!brand?.aiAvailable||!brand.limits.enabled} className="portal-primary-button p-3">{busy?"Working…":"Create and save draft"}</button></div>
  </form>
  {estimate?<p className="mt-3 text-xs">Planning allowance: {estimate.toLocaleString()} tokens. Actual usage varies.</p>:null}
  <p role="status" aria-live="polite" className="mt-4 text-sm">{message||libraryError}</p><p className="mt-2 text-xs text-[#6d6258]">Nothing publishes from the creative studio. Drafts and planned dates remain in your content library until reviewed.</p>
 </section>;
}
