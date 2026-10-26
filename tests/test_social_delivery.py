import importlib.util,unittest,copy
from pathlib import Path
p=Path(__file__).parents[1]/"scripts/social_delivery_worker.py"
spec=importlib.util.spec_from_file_location("worker",p);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Engine:
 def __init__(self,status="publishing",error=False):self.status=status;self.error=error;self.calls=[];self.preflight=False
 def request(self,path,method="GET",data=None):
  self.calls.append((method,path))
  if method=="POST":
   if self.error:raise TimeoutError("unknown response")
   return {}
  if self.preflight and not any(c[0]=="POST" for c in self.calls):
   return {"post":{"id":"engine","status":"draft","media":[{"id":"media"}],"targets":[{"platform":"facebook","connected_account_id":"fb","sections":["approved"]}]}}
  return {"post":{"id":"engine","status":self.status,"targets":[{"platform":"facebook","status":self.status,"remote_id":"remote" if self.status=="published" else None}]}}
class DB:
 def request(self,*a):return True
class Tests(unittest.TestCase):
 def make(self,status="publishing",error=False):
  w=object.__new__(m.Worker);w.engine=Engine(status,error);w.db=DB();w.events=[]
  w.patch=lambda j,v:j.update(v);w.activity=lambda *a:w.events.append(a)
  w.rows=lambda *a:[{"status":"approved","is_test":False,"revision":1,"approved_revision":1,"planned_for":"date","content":{"captions":{"facebook":"approved"}}}]
  j={"id":"job","post_id":"post","revision":1,"planned_for":"date","snapshot":{"content":{"captions":{"facebook":"approved"}}},"result":{"account_ids":["fb"],"media_ids":["media"]},"engine_post_id":"engine","state":"preparing"}
  return w,j
 def test_ambiguous_publish_is_reconciled_without_second_post(self):
  w,j=self.make(error=True);w.engine.preflight=True;w.dispatch(j);w.reconcile(j);w.reconcile(j)
  self.assertEqual([c for c in w.engine.calls if c[0]=="POST"],[("POST","/posts/engine/publish")]);self.assertEqual(j["state"],"submitted")
 def test_published_requires_network_confirmation(self):
  w,j=self.make(status="published");w.reconcile(j);self.assertEqual(j["state"],"published");self.assertEqual(j["result"]["targets"][0]["remote_id"],"remote")
 def test_draft_after_uncertain_dispatch_holds(self):
  w,j=self.make(status="draft");w.reconcile(j);self.assertEqual(j["state"],"uncertain")
 def test_failed_provider_is_not_retried(self):
  w,j=self.make(status="failed");w.reconcile(j);self.assertEqual(j["state"],"failed");self.assertFalse(any(c[0]=="POST" for c in w.engine.calls))
 def test_change_cancels_before_provider_call(self):
  w,j=self.make();j["revision"]=2;w.dispatch(j);self.assertEqual(j["state"],"cancelled");self.assertEqual(w.engine.calls,[])
 def test_sample_and_stale_approval_rejected(self):
  self.assertFalse(m.eligible({"is_test":True,"status":"approved","revision":1,"approved_revision":1,"planned_for":"x"}))
  self.assertFalse(m.eligible({"is_test":False,"status":"approved","revision":2,"approved_revision":1,"planned_for":"x"}))
if __name__=="__main__":unittest.main()

