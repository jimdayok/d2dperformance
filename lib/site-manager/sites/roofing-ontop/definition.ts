import {z} from "zod";
import pages from "./pages.json";
import type {SiteDefinition,ContentModelDefinition} from "@/lib/site-manager/types";
import type {EditorGroup} from "@/lib/site-manager/editor-config";
const groups:Record<string,EditorGroup[]>={};
const models:Record<string,ContentModelDefinition<unknown>>={};
for(const page of pages){
 const shape:Record<string,z.ZodType>={seoTitle:z.string().max(240),seoDescription:z.string().max(1000)};
 for(const f of page.fields)shape[f.key]=z.string().max(f.maxLength);
 models[page.key]={key:page.key,label:page.title,description:"Imported Kajabi page. Layout and integrations stay code controlled.",contentType:"page",schema:z.object(shape).strict(),sections:[],previewPath:()=>page.path,cacheTags:key=>["site:roofing-ontop","content:page","content:page:"+key]};
 groups[page.key]=[{title:"Search preview",fields:[{path:"seoTitle",label:"Page title",maxLength:240},{path:"seoDescription",label:"Search description",kind:"textarea",maxLength:1000}]},{title:"Page copy",fields:page.fields.filter(f=>f.kind!=="image").map(f=>({path:f.key,label:f.label,kind:f.kind==="textarea"?"textarea":"text",maxLength:f.maxLength}))},{title:"Page images",description:"Use a site-owned /assets/ path or a published Supabase storage image URL.",fields:page.fields.filter(f=>f.kind==="image").map(f=>({path:f.key,label:f.label,maxLength:f.maxLength}))}];
}
const base="/portal/sites/roofing-ontop";
export const roofingSiteDefinition:SiteDefinition={
 key:"roofing-ontop",name:"Roofing OnTop & Construction",organizationSlug:"roofing-on-top",productionUrl:"https://www.roofingontop.com",previewAudience:"roofing-ontop",
 navigation:[{label:"Overview",href:base},...pages.filter(p=>!p.path.startsWith("/blog/")&&!p.path.startsWith("/newsletters/")).map(p=>({label:p.path==="/"?"Homepage":p.title.split("|")[0].slice(0,50),href:base+"/content/page/"+p.key,modelKey:p.key})),{label:"All pages and articles",href:base+"/content/page"},{label:"Review Queue",href:base+"/review",requiredRole:"publisher"},{label:"Version History",href:base+"/versions"},{label:"Users and Permissions",href:base+"/users",requiredRole:"site_admin"},{label:"Activity",href:base+"/activity"}],
 models,editorGroups:groups,modelKeyForEntry:(type,key)=>type==="page"&&models[key]?key:null,allowedPreviewPaths:pages.map(p=>p.path),allowedRevalidationTags:["site:roofing-ontop","content:page",...pages.map(p=>"content:page:"+p.key)]
};
