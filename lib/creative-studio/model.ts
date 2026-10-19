import {z} from "zod";
export const creativeStyles=["Cinematic","Professional Commercial","Energetic Social Reel","Luxury / Premium","Documentary","Lifestyle","Product Showcase","Educational","Humorous","Dramatic"] as const;
export const assetRoles=["Opening Frame","Subject Reference","Exact Product Reference","Background Reference","Style Reference","Ending Frame","Logo / Brand Overlay"] as const;
export const sceneSchema=z.object({id:z.string().max(50),duration:z.literal(5),instruction:z.string().max(800),camera:z.string().max(200),transition:z.enum(["cut","fade"]),overlay:z.string().max(90),assetId:z.string().max(100).default(""),audio:z.string().max(200).default("")});
export const guidanceSchema=z.object({summary:z.string().max(1500),audience:z.string().max(500),visualPrompt:z.string().max(1000),motionPrompt:z.string().max(350),audioNotes:z.string().max(500),overlayNotes:z.string().max(500),cta:z.string().max(90),scenes:z.array(sceneSchema).length(4),warnings:z.array(z.string().max(250)).max(8),adjustments:z.object({aspect:z.enum(["portrait","landscape","square"]).optional(),style:z.enum(creativeStyles).optional(),energy:z.number().int().min(0).max(100).optional(),logoTreatment:z.enum(["corner","opening","opening-fade","closing","none"]).optional()}).optional()});
export type Guidance=z.infer<typeof guidanceSchema>;
export type Scene=z.infer<typeof sceneSchema>;
export const videoCapabilities={id:"wavespeed-ai/wan-2.2/i2v-5b-720p",name:"Wan 2.2 · photo animation",resolution:"720p",duration:20,clipDuration:5,clips:4,estimatedCents:20,reference:"One opening image per clip",generatedAudio:false,textToVideo:false,endingFrame:false,negativePrompt:false,fpsControl:false,aspect:"16:9, 9:16 and 1:1 via final compositing"} as const;
export type AssetSelection={id:string;source:"upload"|"vault";role:typeof assetRoles[number]};
export type Project={job?:{id:string;type:"video"|"image";requestId:string}|null;draftId?:string;title:string;brief:string;kind:"video"|"graphic"|"carousel";videoMode:"ai"|"edit";style:typeof creativeStyles[number];aspect:"landscape"|"portrait"|"square";duration:number;platform:"instagram"|"facebook"|"linkedin";planId:string;logo:string;logoTreatment:"corner"|"opening"|"opening-fade"|"closing"|"none";logoPosition:"top-right"|"top-left"|"bottom-right";music:"instrumental"|"none";musicVolume:number;lighting:number;energy:number;environment:number;setting:"studio"|"outdoors"|"nightlife"|"workplace"|"customer-location";motion:"gentle"|"dynamic"|"still";trimStart:number;keepOriginalAudio:number;assets:AssetSelection[];guidance:Guidance|null;scenes:Scene[];prompt:string;outputId:string;versions:Array<{id:string;label:string;prompt:string;mediaId:string;draftId?:string}>};
export function newProject():Project{return {title:"Untitled creative",brief:"",kind:"video",videoMode:"ai",style:"Cinematic",aspect:"portrait",duration:20,platform:"instagram",planId:"",logo:"",logoTreatment:"corner",logoPosition:"top-right",music:"instrumental",musicVolume:15,lighting:60,energy:60,environment:65,setting:"outdoors",motion:"gentle",trimStart:0,keepOriginalAudio:1,assets:[],guidance:null,scenes:[],prompt:"",outputId:"",versions:[]};}
export function compatibleSources(assets:AssetSelection[]){return assets.filter(a=>["Opening Frame","Subject Reference","Exact Product Reference"].includes(a.role));}
export function buildScenePrompts(brief:string,scenes:Scene[],fallback:string){
 return Array.from({length:4},(_,i)=>["Natural physically plausible motion; preserve source identity, age, clothing, product shape and setting. No generated lettering, logos or watermarks.",brief.slice(0,250),scenes[i]?.instruction,scenes[i]?.camera,fallback.slice(0,1600)].filter(Boolean).join(". ").slice(0,3000));
}
export function moveScene(scenes:Scene[],from:number,to:number){const result=[...scenes];if(from<0||to<0||from>=result.length||to>=result.length)return result;const [scene]=result.splice(from,1);result.splice(to,0,scene);return result;}
export function styleDirection(style:typeof creativeStyles[number]){
 const map:Record<typeof style,string>={
 "Cinematic":"Use a clear visual reveal, motivated camera movement, directional lighting and restrained shot continuity.",
 "Professional Commercial":"Lead with a concrete benefit, show the service or product clearly, use controlled lighting and a concise brand close.",
 "Energetic Social Reel":"Open with an immediate visual hook, clear focal points and brisk cuts; keep motion plausible and composition legible on a phone.",
 "Luxury / Premium":"Use negative space, rich textures, deliberate slow movement and restrained lighting. Avoid visual clutter.",
 "Documentary":"Use observational framing, available-looking light and natural actions; do not manufacture customer testimony.",
 "Lifestyle":"Place the subject in a believable everyday situation with natural light and relatable gestures.",
 "Product Showcase":"Prioritize visible product geometry and materials, minimal distractions and controlled movement. Preserve exact lettering through overlays, never generation.",
 "Educational":"Sequence an understandable hook, explanation, example and next step. Keep visuals clear and text outside generation.",
 "Humorous":"Use an understandable visual setup and gentle payoff without inventing endorsements or insulting the subject.",
 "Dramatic":"Build contrast and anticipation through light, reveal and pacing while keeping actions believable."
 };return map[style];
}
