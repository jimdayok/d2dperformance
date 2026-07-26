export type InstagramAccountConfig = {
  handle: string;
  label: string;
  profileUrl: string;
};

const featuredAccounts: InstagramAccountConfig[] = [
  {
    handle: "day2daymarketing",
    label: "DAY2DAY Marketing",
    profileUrl: "https://www.instagram.com/day2daymarketing/",
  },
  {
    handle: "artisanlabntwk",
    label: "Artisan Lab Network",
    profileUrl: "https://www.instagram.com/artisanlabntwk/",
  },
  {
    handle: "gatheronthesquare",
    label: "Gather on the Square",
    profileUrl: "https://www.instagram.com/gatheronthesquare/",
  },
];

function normalizeHandle(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase();
}

function labelFromHandle(handle: string) {
  return handle
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getInstagramAccounts(
  configuredHandles = process.env.INSTAGRAM_SHOWCASE_HANDLES,
) {
  const requestedHandles = configuredHandles
    ? configuredHandles
        .split(",")
        .map(normalizeHandle)
        .filter(Boolean)
    : featuredAccounts.map((account) => account.handle);

  return [...new Set(requestedHandles)].map((handle) => {
    const featured = featuredAccounts.find(
      (account) => account.handle === handle,
    );

    return (
      featured ?? {
        handle,
        label: labelFromHandle(handle),
        profileUrl: `https://www.instagram.com/${handle}/`,
      }
    );
  });
}

export function isSafeInstagramHandle(handle: string) {
  return /^[a-z0-9._]{1,30}$/.test(handle);
}
