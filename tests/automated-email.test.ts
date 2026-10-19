import {describe,expect,it,vi} from "vitest";
const keys=vi.hoisted(()=>vi.fn());
const send=vi.hoisted(()=>vi.fn().mockResolvedValue({data:{id:"accepted"},error:null}));
vi.mock("resend",()=>({Resend:class { constructor(key?: string){keys(key);} emails={send}; }}));
import {AutomatedEmailClient,automatedEmailMessage} from "@/lib/automated-email";
describe("Automated D2D mail",()=>{
 it("uses the dedicated domain key while preserving the legacy fallback",()=>{
  const previous=process.env.D2D_NOREPLY_RESEND_API_KEY;
  try {
   process.env.D2D_NOREPLY_RESEND_API_KEY="restricted-test-only";
   new AutomatedEmailClient("legacy-test-only");
   expect(keys).toHaveBeenLastCalledWith("restricted-test-only");
   delete process.env.D2D_NOREPLY_RESEND_API_KEY;
   new AutomatedEmailClient("legacy-test-only");
   expect(keys).toHaveBeenLastCalledWith("legacy-test-only");
  } finally {
   if(previous===undefined) delete process.env.D2D_NOREPLY_RESEND_API_KEY;
   else process.env.D2D_NOREPLY_RESEND_API_KEY=previous;
  }
 });
 it("uses no-reply without losing recipients, attachments or delivery options",async()=>{
  const attachment={filename:"report.pdf",content:Buffer.from("report")};
  await new AutomatedEmailClient("test-only").emails.send({from:"Andrea <andrea@example.test>",replyTo:"someone@example.test",to:["client@example.test"],subject:"Report",text:"Your report",attachments:[attachment]},{idempotencyKey:"report-1"});
  const [message,options]=send.mock.calls[0];
  expect(message).toMatchObject({from:"D2D Marketing <noreply@d2dmktg.com>",replyTo:"noreply@d2dmktg.com",to:["client@example.test"],attachments:[attachment]});
  expect(message.text).toContain("Please do not reply");
  expect(message.text).toContain("info@d2dmktg.com");
  expect(options).toEqual({idempotencyKey:"report-1"});
 });
 it("keeps the help notice inside complete HTML documents",()=>{
  const message=automatedEmailMessage({from:"old@example.test",to:"client@example.test",subject:"Access",html:"<html><body><p>Sign in</p></body></html>"});
  expect(message.html).toMatch(/Please do not reply[\s\S]*<\/body><\/html>$/);
 });
});
