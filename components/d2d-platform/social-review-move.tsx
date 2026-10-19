"use client";
import {useEffect,useRef,useState} from "react";
import type {ReviewPost,ReviewStatus} from "@/lib/social-review/model";
import {centralISO,centralLocal} from "./social-studio-library";
const labels:Record<string,string>={idea:"Ideas",in_progress:"In progress",pending:"Pending approval",changes_requested:"Changes requested",approved:"Approved",scheduled:"Scheduled",date:"Choose a date"};
export function MovePostDialog({live=false,post,target,proposedDate,busy,onConfirm,onClose,onReview,failure=""}:{live?:boolean;post:ReviewPost;target:ReviewStatus|"date";proposedDate?:string|null;busy:boolean;onConfirm:(action:string,extra?:Record<string,unknown>)=>Promise<boolean>;onClose:()=>void;onReview:()=>void;failure?:string}){
 const ref=useRef<HTMLDialogElement>(null);const [reason,setReason]=useState(""),[error,setError]=useState("");
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
 const datePrompt=target==="date"||target==="scheduled",blocked=target==="approved"&&post.status!=="pending"&&post.status!=="scheduled"||target==="scheduled"&&post.status!=="approved";
 async function submit(form:HTMLFormElement){try{
  let action:string=target==="pending"?"submit":target==="approved"?"approve":target==="changes_requested"?"request_changes":"move";
  let extra:Record<string,unknown>=action==="move"?{targetStatus:target}:action==="request_changes"?{body:reason}:{};
  if(post.status==="scheduled"&&!datePrompt&&!["idea","in_progress"].includes(target)){action="unschedule";extra={targetStatus:target,body:reason};}
  if(datePrompt){const plannedFor=centralISO(String(new FormData(form).get("plannedFor")||""));if(!plannedFor||Date.parse(plannedFor)<=Date.now())throw Error("Choose a future date and time.");action=post.status==="scheduled"?"reschedule":target==="scheduled"?"schedule":"plan";extra={plannedFor};}
  if(await onConfirm(action,extra))onClose();
 }catch(e){setError((e as Error).message);}}
 return <dialog ref={ref} className="sr-move-dialog" aria-labelledby="sr-move-title" onCancel={onClose} onClose={onClose}><div className="sr-move-header"><small>{post.title}</small><h2 id="sr-move-title">{datePrompt?(post.status==="scheduled"?"Move this schedule":"Choose the date and time"):"Move to "+labels[target]}</h2></div>
 <form onSubmit={e=>{e.preventDefault();void submit(e.currentTarget);}}>
 <p>{target==="pending"?"This post enters client review. D2D prepares a branded approval email with a private review link.":target==="approved"?"Confirm the exact creative and platform captions. Only this test post will be approved.":target==="changes_requested"?"Tell the team what needs to change. Your explanation stays with this post.":datePrompt?"Choose the date and Central time for this post. Other posts are unchanged.":"This post returns to preparation. Its previous approval is cleared."}</p>
 {blocked?<p className="sr-error">{target==="approved"?"Submit this post for review before approving it.":"Approve the current post before scheduling it."}</p>:null}
 {datePrompt?<label>Publish date and time · Central<input autoFocus required name="plannedFor" type="datetime-local" defaultValue={proposedDate||(post.planned_for?centralLocal(post.planned_for):"")}/><small>Central time changes between CST and CDT automatically.</small></label>:null}
 {target==="changes_requested"?<label>What needs to change?<textarea required rows={4} value={reason} maxLength={6000} onChange={e=>setReason(e.target.value)}/></label>:null}
 {post.status==="scheduled"&&!datePrompt?<p className="sr-error">Returning this test post to preparation removes its test schedule and approval.</p>:null}
 {(!post.is_test&&!live)&&["approved","scheduled"].includes(target)?<p className="sr-error">Real approvals and scheduling remain blocked in private staging.</p>:null}
 {error||failure?<p role="alert" className="sr-error">{error||failure}</p>:null}
 <div className="sr-button-row"><button className="sr-secondary" type="button" onClick={onClose}>Cancel</button>{blocked?<button type="button" className="sr-primary" onClick={onReview}>Open post review</button>:<button className="sr-primary" disabled={busy||((!post.is_test&&!live)&&["approved","scheduled"].includes(target))}>{datePrompt?(post.status==="scheduled"?"Save new schedule":target==="scheduled"?"Save post schedule":"Save planned date"):"Confirm move"}</button>}</div>
 </form></dialog>;
}
