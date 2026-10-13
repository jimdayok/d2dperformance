export const defaultLimits={enabled:true,daily_limit:5,monthly_limit:60,concurrent_limit:2,video_enabled:true};
export function reportedTokens(value:unknown):number|null{
 if(!value||typeof value!=='object')return null;
 const usage=(value as {usage?:unknown}).usage;
 if(!usage||typeof usage!=='object')return null;
 const total=(usage as {total_tokens?:unknown}).total_tokens;
 return typeof total==='number'&&Number.isSafeInteger(total)&&total>=0?total:null;
}
export function summarizeJobs(jobs:Array<{created_at:string;copy_usage:unknown;image_usage:unknown}>,dayStart:string){
 let tokens=0,unreported=0;
 for(const job of jobs){const copy=reportedTokens(job.copy_usage),image=reportedTokens(job.image_usage);tokens+=(copy??0)+(image??0);if(copy===null||image===null)unreported++;}
 return {monthRequests:jobs.length,dayRequests:jobs.filter(j=>j.created_at>=dayStart).length,reportedTokens:tokens,unreportedJobs:unreported};
}
export function centralPeriodStart(now=new Date()){
 // Intl exposes the date and current Central offset; midnight offset is resolved for that date.
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const toUTC=(value:string)=>{let d=new Date(value+'T00:00:00Z');for(let i=0;i<2;i++){const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',timeZoneName:'longOffset'}).formatToParts(d).find(x=>x.type==='timeZoneName')!.value;const m=p.match(/GMT([+-])(\d\d):(\d\d)/)!;const offset=(Number(m[2])*60+Number(m[3]))*(m[1]==='-'?-1:1);d=new Date(Date.parse(value+'T00:00:00Z')-offset*60000);}return d.toISOString()};
 return {day:toUTC(date),month:toUTC(date.slice(0,7)+'-01')};
}
