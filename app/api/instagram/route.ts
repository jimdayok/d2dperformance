import { NextResponse } from "next/server";
import {
  getInstagramAccounts,
  isSafeInstagramHandle,
  type InstagramAccountConfig,
} from "@/lib/d2dmktg/instagram";

type GraphMedia = {
  id?: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
};

type GraphMediaConnection = {
  data?: GraphMedia[];
};

type BusinessDiscoveryResponse = {
  business_discovery?: {
    media?: GraphMediaConnection;
  };
};

type DirectMediaResponse = {
  data?: GraphMedia[];
};

const sourceHandle = "day2daymarketing";
const mediaFields =
  "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";

function normalizePosts(media: GraphMedia[] | undefined, handle: string) {
  return (media ?? [])
    .map((post) => ({
      id: post.id ?? "",
      caption: post.caption ?? "",
      mediaType: post.media_type ?? "IMAGE",
      imageUrl: post.thumbnail_url || post.media_url || "",
      permalink: post.permalink ?? "",
      timestamp: post.timestamp ?? "",
      handle,
    }))
    .filter((post) => post.id && post.imageUrl && post.permalink);
}

async function requestGraph<T>(
  url: URL,
  accessToken: string,
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    next: { revalidate: 900 },
  });

  if (!response.ok) {
    throw new Error(`Instagram Graph request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function loadAccount(
  account: InstagramAccountConfig,
  accessToken: string,
  sourceAccountId: string,
  graphVersion: string,
) {
  if (!isSafeInstagramHandle(account.handle)) {
    return { ...account, available: false, posts: [] };
  }

  try {
    if (account.handle === sourceHandle) {
      const url = new URL(
        `https://graph.facebook.com/${graphVersion}/${sourceAccountId}/media`,
      );
      url.searchParams.set("fields", mediaFields);
      url.searchParams.set("limit", "9");
      const payload = await requestGraph<DirectMediaResponse>(url, accessToken);

      return {
        ...account,
        available: true,
        posts: normalizePosts(payload.data, account.handle),
      };
    }

    const url = new URL(
      `https://graph.facebook.com/${graphVersion}/${sourceAccountId}`,
    );
    url.searchParams.set(
      "fields",
      `business_discovery.username(${account.handle}){media.limit(9){${mediaFields}}}`,
    );
    const payload = await requestGraph<BusinessDiscoveryResponse>(
      url,
      accessToken,
    );

    return {
      ...account,
      available: true,
      posts: normalizePosts(
        payload.business_discovery?.media?.data,
        account.handle,
      ),
    };
  } catch {
    return { ...account, available: false, posts: [] };
  }
}

export async function GET() {
  const accounts = getInstagramAccounts();
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const sourceAccountId =
    process.env.INSTAGRAM_SOURCE_ACCOUNT_ID ?? "17841479549405420";
  const graphVersion =
    process.env.INSTAGRAM_GRAPH_API_VERSION ?? "v23.0";

  if (!accessToken) {
    return NextResponse.json(
      {
        available: false,
        accounts: accounts.map((account) => ({
          ...account,
          available: false,
          posts: [],
        })),
      },
      {
        headers: {
          "cache-control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  }

  const accountFeeds = await Promise.all(
    accounts.map((account) =>
      loadAccount(
        account,
        accessToken,
        sourceAccountId,
        graphVersion,
      ),
    ),
  );
  const available = accountFeeds.some((account) => account.posts.length > 0);

  return NextResponse.json(
    { available, accounts: accountFeeds },
    {
      headers: {
        "cache-control":
          "public, s-maxage=900, stale-while-revalidate=86400",
      },
    },
  );
}
