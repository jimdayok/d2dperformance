export type StockAsset={title:string;thumbnail:string;url:string;page:string;license:string;author:string;cleared:boolean};
const plain=(value:unknown)=>String(value||"").replace(/<[^>]*>/g,"").slice(0,300);
export function stockAsset(page:{title:string;imageinfo?:Array<{url:string;thumburl?:string;descriptionurl?:string;mime?:string;extmetadata?:Record<string,{value:string}>}>}):StockAsset|null{
 const image=page.imageinfo?.[0];if(!image||!["image/jpeg","image/png","image/webp"].includes(image.mime||""))return null;
 const meta=image.extmetadata||{},license=plain(meta.LicenseShortName?.value),url=new URL(image.url);
 if(url.protocol!=="https:"||url.hostname!=="upload.wikimedia.org")return null;
 const cleared=/^(CC0(?: 1.0)?|Public domain)$/i.test(license);
 return {title:page.title,thumbnail:image.thumburl||image.url,url:image.url,page:image.descriptionurl||"https://commons.wikimedia.org/wiki/"+encodeURIComponent(page.title),license,author:plain(meta.Artist?.value),cleared};
}
export async function searchStock(query:string,title?:string){
 const params=new URLSearchParams({action:"query",format:"json",prop:"imageinfo",iiprop:"url|mime|extmetadata",iiurlwidth:"1400",iithumbwidth:"400",...(title?{titles:title}:{generator:"search",gsrsearch:query,gsrnamespace:"6",gsrlimit:"16"})});
 const response=await fetch("https://commons.wikimedia.org/w/api.php?"+params,{headers:{"User-Agent":"D2DSocialCreativeStudio/1.0 (https://d2dmktg.com)"},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error("Stock search is unavailable. Try again or upload your own media.");
 const data=await response.json();if(data.error)throw Error("Stock search could not be completed.");
 return (Object.values(data.query?.pages||{}) as Parameters<typeof stockAsset>[0][]).map(stockAsset).filter((a):a is StockAsset=>!!a);
}
