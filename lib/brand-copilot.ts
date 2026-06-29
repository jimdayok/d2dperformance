import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { safeJsonParse } from "@/lib/brand-discovery-storage";

type SessionPayload = {
  sid: string;
  exp: number;
};

type CopilotLimitState = {
  count: number;
  resetAt: number;
};

const COOKIE_NAME = "d2d-brand-session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 18;

const rateLimitStore = globalThis as typeof globalThis & {
  __d2dBrandCopilotRateLimits?: Map<string, CopilotLimitState>;
};

function getSecret() {
  return (
    process.env.BRAND_DISCOVERY_SESSION_SECRET ||
    process.env.OPENAI_API_KEY ||
    "local-development-brand-session-secret"
  );
}

function getRateLimitMap() {
  if (!rateLimitStore.__d2dBrandCopilotRateLimits) {
    rateLimitStore.__d2dBrandCopilotRateLimits = new Map();
  }

  return rateLimitStore.__d2dBrandCopilotRateLimits;
}

function signValue(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function encodeSession(payload: SessionPayload) {
  const value = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signValue(value);
  return `${value}.${signature}`;
}

function decodeSession(rawValue?: string | null) {
  if (!rawValue) {
    return null;
  }

  const [value, signature] = rawValue.split(".");
  if (!value || !signature) {
    return null;
  }

  const expected = signValue(value);
  const valid =
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

  if (!valid) {
    return null;
  }

  try {
    const payload = safeJsonParse<SessionPayload | null>(
      Buffer.from(value, "base64url").toString("utf8"),
      null,
    );

    if (!payload) {
      return null;
    }

    if (!payload.sid || !payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function getExpectedOrigin(headerList: Headers) {
  if (process.env.BRAND_DISCOVERY_ALLOWED_ORIGIN) {
    return process.env.BRAND_DISCOVERY_ALLOWED_ORIGIN;
  }

  const host =
    headerList.get("x-forwarded-host") || headerList.get("host") || "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") || "https";

  return `${protocol}://${host}`;
}

async function assertTrustedOrigin() {
  const headerList = await headers();
  const origin = headerList.get("origin");

  if (!origin) {
    return;
  }

  const expected = getExpectedOrigin(headerList);

  try {
    const originUrl = new URL(origin);
    const expectedUrl = new URL(expected);

    if (originUrl.host !== expectedUrl.host) {
      throw new Error("Origin mismatch");
    }
  } catch {
    throw new Response(
      JSON.stringify({
        error: "untrusted_origin",
        message: "This endpoint only accepts requests from the D2D site.",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

function getClientIp(headerList: Headers) {
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return headerList.get("x-real-ip") || "unknown";
}

function assertRateLimit(sessionId: string, ip: string) {
  const store = getRateLimitMap();
  const key = `${sessionId}:${ip}`;
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + RATE_WINDOW_MS,
    });
    return {
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetAt: now + RATE_WINDOW_MS,
    };
  }

  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    throw new Response(
      JSON.stringify({
        error: "rate_limited",
        message:
          "Too many guided follow-up requests. Please wait a few minutes and try again.",
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    remaining: MAX_REQUESTS_PER_WINDOW - existing.count,
    resetAt: existing.resetAt,
  };
}

export async function ensureBrandCopilotSession() {
  await assertTrustedOrigin();

  const cookieStore = await cookies();
  const existing = decodeSession(cookieStore.get(COOKIE_NAME)?.value);

  if (existing) {
    return existing;
  }

  const payload: SessionPayload = {
    sid: randomUUID(),
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };

  cookieStore.set(COOKIE_NAME, encodeSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return payload;
}

export async function requireBrandCopilotSession() {
  await assertTrustedOrigin();

  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(COOKIE_NAME)?.value);

  if (!session) {
    throw new Response(
      JSON.stringify({
        error: "session_required",
        message:
          "A protected brand discovery session is required before using guided follow-up prompts.",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const headerList = await headers();
  const ip = getClientIp(headerList);
  const rateLimit = assertRateLimit(session.sid, ip);

  return {
    session,
    ip,
    rateLimit,
  };
}
