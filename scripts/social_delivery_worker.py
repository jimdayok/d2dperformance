#!/usr/bin/env python3
"""Durable approved-post publisher. Secrets/config are read from an external JSON file."""
import argparse, datetime as dt, fcntl, json, os, time, urllib.request, urllib.parse, urllib.error, uuid
from pathlib import Path

class HTTP:
 def __init__(self,base,key): self.base=base.rstrip("/");self.key=key
 def request(self,path,method="GET",data=None,headers=None):
  h={"Authorization":"Bearer "+self.key,"apikey":self.key,"Accept":"application/json","User-Agent":"D2D-Approved-Publisher/1","Content-Type":"application/json"}
  h.update(headers or {})
  req=urllib.request.Request(self.base+path,data=None if data is None else json.dumps(data).encode(),headers=h,method=method)
  try:
   with urllib.request.urlopen(req,timeout=45) as r:
    raw=r.read();return json.loads(raw) if raw else None
  except urllib.error.HTTPError as e:
   # Never log request headers, signed asset URLs or response bodies carrying secrets.
   raise RuntimeError("Provider request failed: HTTP "+str(e.code)) from None

def eligible(post):
 return not post.get("is_test") and post["status"] in ("approved","scheduled") and post["revision"]==post.get("approved_revision") and bool(post.get("planned_for"))

class Worker:
 def __init__(self,config):
  self.c=config
  self.db=HTTP(config["NEXT_PUBLIC_SUPABASE_URL"],config["SUPABASE_SERVICE_ROLE_KEY"])
  self.engine=HTTP(config["D2D_SOCIAL_API_URL"].rstrip("/")+"/api/v1",config["D2D_SOCIAL_API_KEY"])
 def rows(self,t,q):return self.db.request("/rest/v1/"+t+"?"+q)
 def patch(self,j,values):
  values["updated_at"]=dt.datetime.now(dt.timezone.utc).isoformat()
  self.db.request("/rest/v1/social_deliveries?id=eq."+j["id"],"PATCH",values)
  j.update(values)
 def activity(self,j,state,body):
  ident=str(uuid.uuid5(uuid.NAMESPACE_URL,"d2d-delivery/"+j["id"]+"/"+state))
  self.db.request("/rest/v1/social_review_activity?on_conflict=id","POST",{
   "id":ident,"post_id":j["post_id"],"organization_id":j["organization_id"],"actor_name":"D2D Social publisher",
   "actor_kind":"staff","kind":"delivery_"+state,"body":body
  },{"Prefer":"resolution=ignore-duplicates"})
 def finish(self,j,state,result):
  self.patch(j,{"state":state,"result":result})
  labels={"published":"Published successfully. ","failed":"Publishing failed. ","uncertain":"Publishing needs reconciliation. "}
  if state in labels:self.activity(j,state,labels[state]+json.dumps(result,ensure_ascii=False)[:4000])
 def media(self,p):
  items=[]
  for raw in p["content"].get("legacyMedia",[]):
   u=raw["url"];self.validate_url(u);items.append({"url":u,"alt_text":raw.get("altText",raw.get("alt","Post creative"))})
  ids=p["content"].get("mediaIds",[])
  for mid in ids:
   m=self.rows("social_studio_media","select=*&id=eq."+mid+"&organization_id=eq."+p["organization_id"])
   if len(m)!=1:raise ValueError("Approved media is unavailable")
   path=urllib.parse.quote(m[0]["storage_path"],safe="/")
   signed=self.db.request("/storage/v1/object/sign/social-studio/"+path,"POST",{"expiresIn":3600})
   u=signed["signedURL"]
   if u.startswith("/"):u=self.c["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")+"/storage/v1"+u
   self.validate_url(u);items.append({"url":u,"alt_text":m[0]["name"],"mime":m[0]["mime_type"]})
  if not items:raise ValueError("Approved post has no finished media")
  return items
 def validate_url(self,u):
  parsed=urllib.parse.urlparse(u)
  if parsed.scheme!="https" or parsed.hostname not in self.c["allowed_media_hosts"]:raise ValueError("Approved media host is not configured")
 def prepare(self,j):
  p=j["snapshot"]
  if not eligible(p):raise ValueError("Current revision is not approved")
  captions=p["content"]["captions"]
  routes=self.rows("social_delivery_routes","select=account_id,platform&organization_id=eq."+p["organization_id"])
  mapping={r["platform"]:r["account_id"] for r in routes}
  if not captions or any(k not in mapping for k in captions):raise ValueError("A publishing destination is not configured for every approved platform")
  accounts=self.engine.request("/connected-accounts?per_page=100")
  if isinstance(accounts,dict):accounts=accounts.get("data",[])
  for platform in captions:
   if not any(a["id"]==mapping[platform] and a["platform"]==platform and a["status"]=="active" for a in accounts):raise ValueError("Approved destination is disconnected")
  account_ids=sorted(mapping[k] for k in captions)
  if len(account_ids)==1:destination={"kind":"account","id":account_ids[0]}
  else:
   sets=self.engine.request("/account-sets?per_page=100")
   if isinstance(sets,dict):sets=sets.get("data",[])
   found=next((v for v in sets if sorted(v["connected_account_ids"])==account_ids),None)
   if not found:found=self.engine.request("/account-sets","POST",{"name":"Approved customer destinations "+p["organization_id"][:8],"connected_account_ids":account_ids})
   destination={"kind":"set","id":found["id"]}
  base_caption=next(iter(captions.values()))
  media=self.media(p)
  # All media is uploaded before creating a post. Any ambiguous upload is not a public post.
  media_ids=[]
  for m in media:
   payload={k:v for k,v in m.items() if k!="mime"}
   if m.get("mime","").startswith("video") or urllib.parse.urlparse(m["url"]).path.lower().endswith((".mp4",".mov",".webm")):
    payload.update(media_kind="video",duration_seconds=20,width=1080,height=1920)
   media_ids.append(self.engine.request("/media","POST",payload)["id"])
  # Persist creation intent BEFORE non-idempotent create. Never silently retry uncertain creation.
  self.patch(j,{"result":{"creation_intent":True}})
  post=self.engine.request("/posts","POST",{"base_text":base_caption,"segments":[base_caption],"mentions":[],"destination":destination})["post"]
  self.patch(j,{"engine_post_id":post["id"],"result":{"platforms":list(captions)}})
  self.engine.request("/posts/"+post["id"],"PATCH",{"base_text":base_caption,"segments":[base_caption],"mentions":[],"destination":destination,"media_ids":media_ids,"targets":[{"connected_account_id":mapping[platform],"auto_split":False,"content_override":{"text":caption,"media_ids":media_ids}} for platform,caption in captions.items()]})
  self.patch(j,{"result":{"platforms":list(captions),"prepared":True,"account_ids":account_ids,"media_ids":media_ids}})
 def dispatch(self,j):
  current=self.rows("social_review_posts","select=*&id=eq."+j["post_id"])[0]
  if not eligible(current) or current["revision"]!=j["revision"] or current["content"]!=j["snapshot"]["content"] or current["planned_for"]!=j["planned_for"]:
   self.patch(j,{"state":"cancelled"});return
  prepared=self.engine.request("/posts/"+j["engine_post_id"])["post"]
  if prepared["status"]!="draft":raise ValueError("Prepared post is no longer an unpublished draft")
  if sorted(t["connected_account_id"] for t in prepared["targets"])!=j["result"]["account_ids"]:raise ValueError("Prepared destinations changed")
  for target in prepared["targets"]:
   caption=j["snapshot"]["content"]["captions"][target["platform"]]
   if target["sections"]!=[caption]:raise ValueError("Prepared caption differs from approved content")
  if sorted(m["id"] for m in prepared["media"])!=sorted(j["result"]["media_ids"]):raise ValueError("Prepared media differs from approved content")
  ok=self.db.request("/rest/v1/rpc/begin_social_dispatch","POST",{"check_delivery":j["id"],"check_engine":j["engine_post_id"]})
  if not ok:return
  # Database guard now freezes this approved snapshot through provider confirmation.
  j["state"]="dispatching"
  try:
   self.engine.request("/posts/"+j["engine_post_id"]+"/publish","POST",{})
   self.patch(j,{"state":"submitted"})
  except Exception:
   # Reconcile through GET only. Never repeat a possibly accepted publish call.
   pass
 def reconcile(self,j):
  p=self.engine.request("/posts/"+j["engine_post_id"])["post"]
  targets=p.get("targets",[])
  results=[{k:t.get(k) for k in ("platform","status","remote_id","remote_url","posted_at","error_kind","error_message")} for t in targets]
  if targets and all(t["status"]=="published" for t in targets):
   self.finish(j,"published",{"engine_post_id":p["id"],"targets":results})
  elif p["status"] in ("failed","partial"):
   self.finish(j,"failed",{"engine_post_id":p["id"],"targets":results})
  elif p["status"]=="draft":
   self.finish(j,"uncertain",{"engine_post_id":p["id"],"reason":"Publish submission not confirmed. Inspect before retrying."})
  else:
   self.patch(j,{"state":"submitted","result":{"engine_post_id":p["id"],"targets":results}})
 def tick(self):
  jobs=self.rows("social_deliveries","select=*&state=in.(preparing,dispatching,submitted)&order=created_at&limit=25")
  fresh=self.db.request("/rest/v1/rpc/claim_social_delivery","POST",{})
  if fresh:jobs.append(fresh)
  for j in jobs:
   try:
    if j["state"]=="preparing":
     if j["result"].get("creation_intent") and not j.get("engine_post_id"):
      self.finish(j,"uncertain",{"reason":"Draft creation outcome needs reconciliation; no automatic publish retry."});continue
     if not j.get("engine_post_id"):self.prepare(j)
     elif not j["result"].get("prepared"):
      self.finish(j,"failed",{"reason":"Draft preparation interrupted. Draft remains unpublished."});continue
     self.dispatch(j)
    if j["state"] in ("dispatching","submitted"):self.reconcile(j)
   except ValueError as ex:
    if j["state"]=="preparing":self.finish(j,"failed",{"reason":str(ex)})
    else:print(json.dumps({"delivery":j["id"],"error":str(ex)}),flush=True)
   except Exception as ex:
    # HTTP failures before publishing are safe to retry only before post-creation intent.
    if j["state"]=="preparing" and not j.get("engine_post_id") and not j["result"].get("creation_intent"):
     print(json.dumps({"delivery":j["id"],"state":"preparing","error":str(ex)}),flush=True)
    else:
     print(json.dumps({"delivery":j["id"],"state":j["state"],"error":str(ex)}),flush=True)
  # Receipts are idempotent and retried after a crash between result storage and activity insertion.
  for j in self.rows("social_deliveries","select=*&state=in.(published,failed,uncertain)&order=updated_at.desc&limit=25"):
   self.activity(j,j["state"],{"published":"Published successfully. ","failed":"Publishing failed. ","uncertain":"Publishing needs reconciliation. "}[j["state"]]+json.dumps(j["result"],ensure_ascii=False)[:4000])

def main():
 ap=argparse.ArgumentParser();ap.add_argument("--config",required=True);ap.add_argument("--once",action="store_true");args=ap.parse_args()
 config=json.loads(Path(args.config).read_text())
 lock=open(config["lock_path"],"w");fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 worker=Worker(config)
 while True:
  try:worker.tick()
  except Exception as ex:print(json.dumps({"error":str(ex)}),flush=True)
  if args.once:break
  time.sleep(15)
if __name__=="__main__":main()

