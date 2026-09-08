import "server-only";

type ConnectedAccount = {
  id: string;
  platform: "facebook" | "instagram" | "linkedin";
  status: string;
};

type MediaInput = { url: string; altText?: string };

type DraftInput = {
  platform: ConnectedAccount["platform"];
  caption: string;
  media: MediaInput[];
};

type ShoutrrrPost = {
  id: string;
  targets: Array<{ connected_account_id: string; platform: string }>;
};

function config() {
  const baseUrl = process.env.D2D_SOCIAL_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.D2D_SOCIAL_API_KEY;
  if (!baseUrl || !apiKey) throw new Error("D2D Social API is not configured.");
  return { apiUrl: `${baseUrl}/api/v1`, apiKey };
}

function validateMediaUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("Social media assets must use HTTPS.");
  const allowedHosts = (process.env.D2D_ALLOWED_MEDIA_HOSTS ?? "")
    .split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
  if (allowedHosts.length === 0 || !allowedHosts.includes(url.hostname.toLowerCase())) {
    throw new Error(`Media host ${url.hostname} is not approved for D2D Social.`);
  }
  return url.toString();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiUrl, apiKey } = config();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      cache: "no-store",
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error(`D2D Social API ${response.status}: ${detail || "request failed"}`);
    }
    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

export async function listConnectedAccounts(): Promise<ConnectedAccount[]> {
  const result = await request<{ data?: ConnectedAccount[] } | ConnectedAccount[]>("/connected-accounts?per_page=100");
  return Array.isArray(result) ? result : result.data ?? [];
}

async function uploadMedia(input: MediaInput): Promise<string> {
  const result = await request<{ id: string }>("/media", {
    method: "POST",
    body: JSON.stringify({ url: validateMediaUrl(input.url), alt_text: input.altText ?? null }),
  });
  return result.id;
}

export async function createPlatformDraft(input: DraftInput): Promise<string> {
  const accounts = await listConnectedAccounts();
  const account = accounts.find((row) => row.platform === input.platform && row.status === "active");
  if (!account) throw new Error(`No connected ${input.platform} account is available.`);
  const created = await request<{ post: ShoutrrrPost }>("/posts", {
    method: "POST",
    body: JSON.stringify({
      base_text: input.caption,
      segments: [input.caption],
      mentions: [],
      destination: { kind: "account", id: account.id },
    }),
  });
  const mediaIds = await Promise.all(input.media.map(uploadMedia));
  if (mediaIds.length > 0) {
    await request(`/posts/${created.post.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        base_text: input.caption,
        segments: [input.caption],
        mentions: [],
        destination: { kind: "account", id: account.id },
        media_ids: mediaIds,
        targets: [{
          connected_account_id: account.id,
          auto_split: false,
          content_override: { text: input.caption, media_ids: mediaIds },
        }],
      }),
    });
  }
  return created.post.id;
}

export async function schedulePost(postId: string, scheduledAt: string) {
  if (process.env.D2D_SOCIAL_SCHEDULING_ENABLED !== "true") {
    throw new Error("D2D Social scheduling is disabled until production approval.");
  }
  await request(`/posts/${postId}/schedule`, {
    method: "POST",
    body: JSON.stringify({ scheduled_at: scheduledAt }),
  });
}
