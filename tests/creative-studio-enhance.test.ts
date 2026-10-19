import {afterEach,it,expect,vi} from "vitest";
vi.mock("server-only",()=>({}));
vi.mock("@/lib/social-ai/key",()=>({socialKey:()=>"test-only"}));
import {enhanceIntent,enhancementInstructions,type CreativeIntent} from "@/lib/creative-studio/enhance";
const intent:CreativeIntent={brief:"A 20 second roof promotion",style:"Professional Commercial",platform:"instagram",aspect:"portrait",duration:20,kind:"video",model:"wavespeed-ai/wan-2.2/i2v-5b-720p",assets:[],settings:{lighting:70},scenes:[],refinement:"Make the roof the focus"};
afterEach(()=>vi.unstubAllGlobals());
it("uses only a text guidance request and validates structured model-compatible output",async()=>{
 const guidance={summary:"Four shots",audience:"Homeowners",visualPrompt:"A roof",motionPrompt:"A gentle reveal",audioNotes:"Music only",overlayNotes:"Composite actual logo",cta:"Learn more",scenes:Array.from({length:4},(_,i)=>({id:String(i),duration:5,instruction:"Roof",camera:"Slow pan",transition:"cut",overlay:"",assetId:"",audio:""})),warnings:[]};
 const fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>({output:[{content:[{type:"output_text",text:JSON.stringify(guidance)}]}],usage:{total_tokens:100}})});vi.stubGlobal("fetch",fetch);
 const result=await enhanceIntent(intent,{name:"Customer",voice:"Professional"});expect(result.guidance.scenes).toHaveLength(4);
 expect(fetch).toHaveBeenCalledTimes(1);expect(fetch.mock.calls[0][0]).toBe("https://api.openai.com/v1/responses");
 const body=JSON.parse(fetch.mock.calls[0][1].body);expect(JSON.stringify(body.input)).toContain("Customer");expect(body.store).toBe(false);expect(body.text.format.type).toBe("json_schema");expect(body.text.format.strict).toBe(true);expect(body.instructions).toContain("Never generate"); // strict wording checked below
});
it("separates creative suggestions from unsupported conditioning and media execution",()=>{
 const instructions=enhancementInstructions(intent);
 expect(instructions).toContain("never promise exact");expect(instructions).toContain("no ending-frame");expect(instructions).toContain("Do not claim applied changes or initiate generation");
});
