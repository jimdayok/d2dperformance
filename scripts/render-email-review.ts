import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const {buildClientInstructionsEmail}=await import(new URL('../lib/d2d-platform/client-instructions-email-template.ts',import.meta.url).href);
const {buildSocialReviewEmail}=await import(new URL('../lib/social-review/email-template.ts',import.meta.url).href);
const {automatedEmailMessage,automatedEmailFrom,automatedEmailReplyTo}=await import(new URL('../lib/automated-email.ts',import.meta.url).href);
const directory=process.argv[2]||'/tmp/d2d-email-review';
await mkdir(directory,{recursive:true});
const examples=[
 ['Account instructions',buildClientInstructionsEmail({displayName:'Sample Reviewer',email:'preview@example.test',organizationName:'Sample client for staging review',loginUrl:'https://webadmin.d2dmktg.com/portal/login',supportEmail:'info@d2dmktg.com',services:[{product:'social',label:'D2D Social',description:'Review your social content and request changes.',role:'reviewer'}]})],
 ['Social review notice',buildSocialReviewEmail({event:'approval_requested',title:'Sample post for staging review',organization:'Sample client for staging review',body:'Your post is ready. Open the workspace to approve it or request changes.',reviewUrl:'https://webadmin.d2dmktg.com/portal/marketing',recipientRole:'client',live:false})]
];
for(const [index,[label,message]] of examples.entries()){
 const output=automatedEmailMessage({from:automatedEmailFrom,to:'preview@example.test',...message});
 await writeFile(join(directory,'email-'+index+'.html'),output.html);
}
const cards=examples.map(([label,message],index)=>'<section><h2>'+label+'</h2><p><b>From:</b> '+automatedEmailFrom.replaceAll('<','&lt;').replaceAll('>','&gt;')+'<br><b>Reply-To:</b> '+automatedEmailReplyTo+'<br><b>To:</b> preview@example.test (fictional sample)<br><b>Subject:</b> '+message.subject+'</p><iframe title="'+label+'" src="email-'+index+'.html" sandbox=""></iframe></section>').join('');
await writeFile(join(directory,'index.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><title>D2D automated email review</title><style>body{font:16px Arial;background:#f3eee6;color:#302a25;max-width:1050px;margin:40px auto;padding:0 20px}h1{font-family:Georgia}section{background:#fffdfa;border:1px solid #ded4c9;padding:24px;border-radius:12px;margin:24px 0}p{line-height:1.65}iframe{width:100%;height:1050px;border:0}aside{padding:16px;background:#fff1d8;border:1px solid #d6a77f}</style><h1>Automated email review</h1><p>Private staging • Fictional sample recipients • Nothing sent</p><aside>Publication hold: the email provider sender domain and no-reply inbound handling still need verification. These samples are safe to review now.</aside><p>The same sender and no-reply notice apply to contact, account instructions, brand discovery, website feedback, digital reports and social review notifications. These two examples use the actual application templates.</p>'+cards+'</html>');
console.log('Two no-send email samples rendered.');

