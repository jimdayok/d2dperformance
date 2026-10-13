import { createHmac, timingSafeEqual } from 'node:crypto';
export function verifyOwnerTicket(token, audience, secret, now = Date.now()) {
  if (!secret || secret.length < 64 || typeof token !== 'string' || token.length > 2048) throw Error('Invalid ticket');
  const pieces = token.split('.');
  if (pieces.length !== 2) throw Error('Invalid ticket');
  const [payload, signature] = pieces;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  const a = Buffer.from(signature), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a,b)) throw Error('Invalid ticket');
  const claim = JSON.parse(Buffer.from(payload,'base64url').toString());
  if (claim.iss !== 'd2d-private-hub' || claim.aud !== audience || claim.sub !== 'jim@d2dmktg.com' || !Number.isInteger(claim.iat) || !Number.isInteger(claim.exp) || claim.iat > now + 5000 || claim.exp <= now || claim.exp - claim.iat > 30000 || !/^[a-f0-9-]{36}$/.test(claim.jti)) throw Error('Invalid ticket');
  return claim;
}
export function hubOriginAllowed(origin) {
  return ['https://d2dsites.tail56c449.ts.net','http://localhost:13100','http://127.0.0.1:13100'].includes(origin);
}
