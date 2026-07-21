import "server-only";
import { importPKCS8, importSPKI, jwtVerify, SignJWT } from "jose";

function privateKeyValue() {
  const value = process.env.D2D_CMS_SIGNING_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!value) throw new Error("D2D CMS signing key is not configured.");
  return value;
}

export async function signCmsToken(input: { audience: string; siteId: string; siteSlug: string; userId: string; path: string; action: "preview" | "revalidate"; tags?: string[] }) {
  const key = await importPKCS8(privateKeyValue(), "RS256");
  const kid = process.env.D2D_CMS_SIGNING_KEY_ID;
  if (!kid) throw new Error("D2D CMS signing key ID is not configured.");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ siteId: input.siteId, siteSlug: input.siteSlug, userId: input.userId, path: input.path, action: input.action, tags: input.tags })
    .setProtectedHeader({ alg: "RS256", kid }).setAudience(input.audience).setIssuedAt(now).setExpirationTime(now + 300).setJti(crypto.randomUUID()).sign(key);
}

export async function verifyCmsToken(token: string, audience: string, action: "preview" | "revalidate") {
  const publicValue = process.env.D2D_CMS_SIGNING_PUBLIC_KEY?.replace(/\\n/g, "\n");
  const privateValue = privateKeyValue();
  const publicKey = publicValue
    ? await importSPKI(publicValue, "RS256")
    : await importPKCS8(privateValue, "RS256");
  const { payload, protectedHeader } = await jwtVerify(token, publicKey, { algorithms: ["RS256"], audience });
  if (protectedHeader.kid !== process.env.D2D_CMS_SIGNING_KEY_ID || payload.action !== action) throw new Error("Invalid CMS token scope.");
  return payload;
}
