import { createHmac, timingSafeEqual } from "node:crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
async function handle(request: Request) {
  try {
    const secret = process.env.D2D_HUB_SIGNING_SECRET;
    const token = request.headers.get("x-d2d-hub-ticket") || "";
    if (!secret || secret.length < 64 || token.length > 2048) throw Error("Unauthorized");
    const [payload, signature, extra] = token.split(".");
    const expected = createHmac("sha256", secret).update(payload || "").digest("base64url");
    const a = Buffer.from(signature || ""), b = Buffer.from(expected);
    if (extra || a.length !== b.length || !timingSafeEqual(a,b)) throw Error("Unauthorized");
    const c = JSON.parse(Buffer.from(payload,"base64url").toString());
    const now = Date.now();
    if (c.iss !== "d2d-private-hub" || c.sub !== "jim@d2dmktg.com" || c.aud !== "customer-registry" || !Number.isInteger(c.iat) || !Number.isInteger(c.exp) || c.iat > now + 5000 || c.exp <= now || c.exp - c.iat > 30000 || !/^[a-f0-9-]{36}$/.test(c.jti)) throw Error("Unauthorized");
    const db = createSupabaseAdminClient();
    const { error: replay } = await db.from("d2d_hub_used_tickets").insert({id:c.jti,audience:c.aud});
    if (replay) throw Error("Unauthorized");
    // Retain only a day of nonces; expired signed tickets cannot be replayed.
    await db.from("d2d_hub_used_tickets").delete().eq("audience","customer-registry").lt("consumed_at",new Date(now-86400000).toISOString());
    if (request.method === "GET") {
      const {data,error} = await db.from("organizations").select("id,name,slug,status,created_at").order("id").range(0,9999);
      if (error || !data || data.length === 10000) throw Error("Customer snapshot unavailable");
      return Response.json({customers:data},{headers});
    }
    const raw = await request.text();
    if (raw.length > 4096) return Response.json({error:"Request too large"},{status:413,headers});
    const input = JSON.parse(raw);
    if (typeof input.name !== "string" || input.name.trim().length > 120 || !input.name.trim() || typeof input.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) || input.slug.length > 80 || !/^[a-f0-9-]{36}$/.test(input.id)) return Response.json({error:"Invalid customer identity"},{status:400,headers});
    // The single private coordinator serializes creation. A stable supplied UUID
    // makes uncertain responses safe to retry without a new database migration.
    const key = (name: string) => name.trim().replace(/\s+/g," ").toLowerCase();
    const {data:rows,error:lookup} = await db.from("organizations").select("id,name,slug").range(0,9999);
    if (lookup || !rows || rows.length === 10000) throw Error("Snapshot unavailable");
    const matches = rows.filter(row => key(row.name) === key(input.name));
    if (matches.length > 1) return Response.json({error:"Duplicate customer names need review."},{status:409,headers});
    if (matches.length === 1) return Response.json({id:matches[0].id,created:false},{headers});
    if (rows.some(row => row.id === input.id || row.slug === input.slug)) return Response.json({error:"Customer identifier is already assigned."},{status:409,headers});
    const {data,error} = await db.from("organizations").insert({id:input.id,name:input.name.trim(),slug:input.slug,status:"active"}).select("id").single();
    if (!error && data) return Response.json({id:data.id,created:true},{headers});
    // Concurrent retry of the same identity is harmless. Never overwrite a tenant.
    const {data:existing} = await db.from("organizations").select("id,name").eq("id",input.id).maybeSingle();
    if (existing && key(existing.name) === key(input.name)) return Response.json({id:existing.id,created:false},{headers});
    return Response.json({error:"Customer could not be linked; review conflicting names or identifiers."},{status:409,headers});
  } catch { return Response.json({error:"Customer connector unavailable or unauthorized"},{status:403,headers}); }
}
export const GET = handle;
export const POST = handle;
