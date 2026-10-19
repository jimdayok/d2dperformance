"use client";
/* eslint-disable @next/next/no-img-element -- shared test creative is scoped by the private review link */
import {useState} from "react";
import type {ReviewPost,ReviewActivity} from "@/lib/social-review/model";
import {PostDialog,MobileReviewCard,HoverCaptionContext} from "./social-review-workspace";
import "./social-review.css";
type Shared={live?:boolean;organizationName:string;expiresAt:string;posts:ReviewPost[];activity:ReviewActivity[]};
export function SocialClientReview({token,initial}:{token:string;initial:Shared}){
 const [data,setData]=useState(initial),[selected,setSelected]=useState<string|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 const chosen=data.posts.find(p=>p.id===selected);
 async function action(name:string,extra:Record<string,unknown>={}){
  if(!chosen||busy)return false;setBusy(true);setError("");setMessage("");
  try{const r=await fetch("/api/social-review/client/"+token,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:name,id:chosen.id,revision:chosen.revision,lockVersion:chosen.lock_version,...extra})});const d=await r.json();if(!r.ok)throw Error(d.error);const updated=await fetch("/api/social-review/client/"+token,{cache:"no-store"});const shared=await updated.json();if(!updated.ok)throw Error(shared.error);setData(shared);setMessage(d.message);return true;}catch(e){setError((e as Error).message);return false;}finally{setBusy(false);}
 }
 async function respondToHover(post:ReviewPost,name:"approve"|"request_changes",body:string,revision:number,lockVersion:number){
  if(busy)throw Error("Wait for the current review to finish.");setBusy(true);setError("");setMessage("");
  try{const r=await fetch("/api/social-review/client/"+token,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:name,id:post.id,body,revision,lockVersion})});const d=await r.json();if(!r.ok)throw Error(d.error);const updated=await fetch("/api/social-review/client/"+token,{cache:"no-store"});const shared=await updated.json();if(!updated.ok)throw Error(shared.error);setData(shared);setMessage(name==="approve"?"Post approved. It has not been published.":"Changes requested. Your feedback is saved for D2D.");}finally{setBusy(false);}
 }
 return <HoverCaptionContext.Provider value={{live:data.live,canEdit:false,canReview:true,busy,respond:respondToHover}}><main className="sr-client-page sr-workspace"><header className="sr-header"><div className="sr-brand"><img src="/assets/platforms/d2d-social-pages-logo.png" alt="D2D Social"/><div><p>{data.organizationName}</p><h1>Your posts, ready to review.</h1></div></div><a href="mailto:socialpages@d2dmktg.com">Contact D2D</a></header><div className="sr-staging-banner"><strong>{data.live?"Private client review":"Private sample review"}</strong><span>No login required · Only the posts shared in this link are available · Nothing publishes when you approve. D2D manages the posting process separately.</span></div><p className="sr-view-description">Tap Review image & caption to browse the carousel and platform captions, then approve or request changes. Open a post for the full editing and activity view. Your feedback stays with this post. This link expires {new Date(data.expiresAt).toLocaleString()}.</p>{error?<p role="alert" className="sr-error">{error}</p>:null}{message?<p role="status" className="sr-notice">{message}</p>:null}<div className="sr-client-cards">{data.posts.map(p=><MobileReviewCard key={p.id} post={p} onDetails={()=>{setSelected(p.id);setMessage("");}}/>)}</div>{chosen?<PostDialog live={data.live} key={chosen.id} post={chosen} accountName={data.organizationName} activity={data.activity.filter(a=>a.post_id===chosen.id)} canCreate canReview clientMode busy={busy} onAction={action} onClose={()=>setSelected(null)} message={message} failure={error}/>:null}</main></HoverCaptionContext.Provider>;
}
