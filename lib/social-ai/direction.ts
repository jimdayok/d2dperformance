import {z} from "zod";
export const directionSchema=z.object({
 lighting:z.number().int().min(0).max(100).default(50),
 energy:z.number().int().min(0).max(100).default(50),
 environment:z.number().int().min(0).max(100).default(50),
 setting:z.enum(["studio","outdoors","nightlife","workplace","customer-location"]).default("studio"),
 notes:z.string().max(1500).default(""),
 motion:z.enum(["gentle","dynamic","still"]).default("gentle"),
 trimStart:z.number().min(0).max(3600).default(0),
 duration:z.number().min(5).max(30).default(20)
});
export function directionText(d:z.infer<typeof directionSchema>){
 return "Lighting "+d.lighting+"/100 (0=dark and moody, 100=light and airy); energy "+d.energy+"/100 (0=calm, 100=exciting); environment "+d.environment+"/100 (0=nighttime, 100=bright daylight); setting "+d.setting+"; motion "+d.motion+". Director notes: "+d.notes;
}
