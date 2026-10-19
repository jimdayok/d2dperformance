import {z} from "zod";
import {socialPlatforms} from "./platforms";
export const reviewCaptions=z.partialRecord(z.enum(socialPlatforms),z.string().trim().min(1).max(10000)).refine(v=>Object.keys(v).length>0,"Choose at least one platform.");
export const reviewEditFields={title:z.string().trim().min(1).max(180),captions:reviewCaptions,brief:z.string().max(4000).default(""),tags:z.array(z.string().max(60)).max(15).default([]),campaign:z.string().trim().max(120).default(""),contentType:z.enum(["evergreen","campaign"]).default("evergreen"),productFocus:z.string().trim().max(180).default("")};
export function editPatch(input:{title:string;captions:Record<string,string>;brief:string;tags:string[];campaign:string;contentType:string;productFocus:string}){return {title:input.title,captions:input.captions,brief:input.brief,tags:input.tags,campaign:input.campaign,contentType:input.contentType,productFocus:input.productFocus};}
