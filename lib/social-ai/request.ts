export function isSameOrigin(request:Request){
 try{
  const origin=request.headers.get("origin");if(!origin)return false;
  const parsed=new URL(origin);
  return ["http:","https:"].includes(parsed.protocol)&&parsed.host===(request.headers.get("host")||new URL(request.url).host);
 }catch{return false}
}
