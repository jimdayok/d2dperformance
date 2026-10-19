import type {ReviewPost} from "./model";
export function legacyDeliveryLocked(post:Pick<ReviewPost,"source_legacy_item_id"|"legacy_batch_status">){return Boolean(post.source_legacy_item_id&&["scheduled","scheduling","published"].includes(post.legacy_batch_status||""));}
export function legacyCreative(content:{mediaIds?:unknown;legacyMedia?:unknown}):ReviewPost["media"]{
 if(Array.isArray(content.mediaIds)&&content.mediaIds.length||!Array.isArray(content.legacyMedia))return [];
 return content.legacyMedia.flatMap((raw:unknown)=>{
  if(!raw||typeof raw!=="object")return [];const item=raw as Record<string,unknown>;if(typeof item.url!=="string")return [];
  try{if(new URL(item.url).protocol!=="https:")return [];}catch{return [];}
  const video=String(item.type||item.mime_type||"").startsWith("video")||/\.(mp4|webm|mov)([?#]|$)/i.test(item.url);
  return [{url:item.url,type:video?"video/mp4":"image/jpeg",alt:typeof item.altText==="string"?item.altText:typeof item.alt==="string"?item.alt:"Post creative"}];
 });
}
