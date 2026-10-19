import {describe,it,expect} from "vitest";
import {buildScenePrompts,compatibleSources,guidanceSchema,moveScene,newProject,styleDirection,videoCapabilities,type Scene} from "@/lib/creative-studio/model";
import {stockAsset} from "@/lib/creative-studio/stock";
const scenes:Scene[]=Array.from({length:4},(_,i)=>({id:String(i),duration:5,instruction:"Scene "+i,camera:"Slow controlled pan",transition:"cut",overlay:"Verified brand copy",assetId:"",audio:"Instrumental"}));
describe("Creative Studio contracts",()=>{
 it("conditions video only on supported references, never on logos or unsupported ending frames",()=>{
  const p=newProject();p.assets=[{id:"product",source:"upload",role:"Exact Product Reference"},{id:"logo",source:"upload",role:"Logo / Brand Overlay"},{id:"style",source:"vault",role:"Style Reference"},{id:"end",source:"upload",role:"Ending Frame"}];
  expect(compatibleSources(p.assets).map(a=>a.id)).toEqual(["product"]);
  expect(videoCapabilities).toMatchObject({clips:4,clipDuration:5,duration:20,textToVideo:false,endingFrame:false,generatedAudio:false});
 });
 it("builds independently directed shots with deterministic text left out of model prompts",()=>{
  const prompts=buildScenePrompts("Roofing promotion",scenes,"Lighting 75, energetic; premium service.");
  expect(prompts).toHaveLength(4);expect(prompts[2]).toContain("Scene 2");expect(prompts[2]).toContain("Lighting 75");expect(prompts[2]).not.toContain("Verified brand copy");expect(prompts.every(p=>p.length<=3000)).toBe(true);
 });
 it("reorders without mutating scenes or changing durations and selected references",()=>{
  const result=moveScene(scenes,0,3);expect(result.map(s=>s.id)).toEqual(["1","2","3","0"]);expect(scenes[0].id).toBe("0");expect(result.reduce((n,s)=>n+s.duration,0)).toBe(20);
 });
 it("rejects unsupported durations and fewer shots in enhanced output",()=>{
  const d={summary:"Plan",audience:"Homeowners",visualPrompt:"A home exterior",motionPrompt:"Slow pan",audioNotes:"Instrumental",overlayNotes:"Actual logo only",cta:"Contact us",scenes,warnings:[]};
  expect(guidanceSchema.safeParse(d).success).toBe(true);
  expect(guidanceSchema.safeParse({...d,scenes:scenes.slice(0,3)}).success).toBe(false);
  expect(guidanceSchema.safeParse({...d,scenes:scenes.map(s=>({...s,duration:10}))}).success).toBe(false);
  expect(guidanceSchema.safeParse({...d,adjustments:{aspect:"cinemascope"}}).success).toBe(false);
 });
 it("turns style selections into different production approaches",()=>{expect(styleDirection("Documentary")).toContain("observational");expect(styleDirection("Product Showcase")).toContain("geometry");expect(styleDirection("Cinematic")).not.toBe(styleDirection("Humorous"));});
 it("clears only known public licenses and approved download hosts",()=>{
  const asset={title:"File:Roof.jpg",imageinfo:[{url:"https://upload.wikimedia.org/example.jpg",mime:"image/jpeg",extmetadata:{LicenseShortName:{value:"CC0"}}}]};
  expect(stockAsset(asset)?.cleared).toBe(true);expect(stockAsset({...asset,imageinfo:[{...asset.imageinfo[0],extmetadata:{LicenseShortName:{value:"CC BY-SA 4.0"}}}]} )?.cleared).toBe(false);
  expect(stockAsset({...asset,imageinfo:[{...asset.imageinfo[0],url:"http://127.0.0.1/private"}]})).toBeNull();
 });
});
