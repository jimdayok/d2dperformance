export const socialPlatforms = ["facebook","instagram","linkedin","tiktok","threads","x"] as const;
export type SocialPlatform = typeof socialPlatforms[number];
export const platformNames:Record<string,string>={facebook:"Facebook",instagram:"Instagram",linkedin:"LinkedIn",tiktok:"TikTok",threads:"Threads",x:"X"};
export const platformMarks:Record<string,string>={facebook:"f",instagram:"◎",linkedin:"in",tiktok:"♪",threads:"@",x:"𝕏"};
export function previewWarnings(platform:string,caption:string,kind:string){
 const warnings:string[]=[];
 if(platform==="x"&&caption.length>280)warnings.push("Over 280 characters. Shorten this caption or confirm the connected account's longer-post support.");
 if(platform==="threads"&&caption.length>500)warnings.push("Over the standard 500-character caption. Review the intended Threads format.");
 if(platform==="instagram"&&caption.length>2200)warnings.push("This Instagram caption exceeds 2,200 characters.");
 if(platform==="tiktok"&&kind!=="video")warnings.push("Photo-post concept. Confirm this account's photo publishing support before delivery.");
 return warnings;
}
