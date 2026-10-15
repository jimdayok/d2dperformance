export type LeadAttribution = {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  landingPath: string;
  referrerDomain: string;
  referralClass: string;
};

const storageKey = "d2d-lead-attribution-v1";
const aiSources = [
  "chatgpt.com",
  "perplexity.ai",
  "claude.ai",
  "gemini.google.com",
  "copilot.microsoft.com",
];
const searchSources = [
  "google.com",
  "bing.com",
  "duckduckgo.com",
  "search.yahoo.com",
];

function clean(value: string | null | undefined, maxLength = 100) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function hostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function matchesDomain(host: string, candidates: string[]) {
  return candidates.some(
    (candidate) => host === candidate || host.endsWith(`.${candidate}`),
  );
}

function referralClass(
  referrerDomain: string,
  siteDomain: string,
  hasCampaign: boolean,
) {
  if (matchesDomain(referrerDomain, aiSources)) return "ai_referral";
  if (matchesDomain(referrerDomain, searchSources)) return "organic_search";
  if (hasCampaign) return "campaign";
  if (!referrerDomain) return "direct";
  if (referrerDomain === siteDomain || referrerDomain.endsWith(`.${siteDomain}`)) {
    return "internal";
  }
  return "referral";
}

export function deriveLeadAttribution(
  currentUrl: string,
  referrerUrl: string,
): LeadAttribution {
  let destination: URL;
  try {
    destination = new URL(currentUrl);
  } catch {
    destination = new URL("https://d2dmktg.com/");
  }

  const referrerDomain = hostname(referrerUrl);
  const siteDomain = destination.hostname.replace(/^www\./, "").toLowerCase();
  const campaign = clean(destination.searchParams.get("utm_campaign"));
  const content = clean(destination.searchParams.get("utm_content"));
  const term = clean(destination.searchParams.get("utm_term"));
  const explicitSource = clean(destination.searchParams.get("utm_source"));
  const explicitMedium = clean(destination.searchParams.get("utm_medium"));
  const hasCampaign = Boolean(
    explicitSource || explicitMedium || campaign || content || term,
  );
  const classification = referralClass(
    referrerDomain,
    siteDomain,
    hasCampaign,
  );

  const inferredSource =
    classification === "direct" || classification === "internal"
      ? classification
      : referrerDomain;
  const inferredMedium =
    classification === "organic_search"
      ? "organic"
      : classification === "ai_referral"
        ? "ai_referral"
        : classification === "referral"
          ? "referral"
          : classification === "direct"
            ? "none"
            : "";

  return {
    source: explicitSource || inferredSource,
    medium: explicitMedium || inferredMedium,
    campaign,
    content,
    term,
    landingPath: clean(destination.pathname || "/", 200),
    referrerDomain:
      classification === "internal" ? "" : clean(referrerDomain, 253),
    referralClass: classification,
  };
}

export function captureLeadAttribution() {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(storageKey)) return;
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify(deriveLeadAttribution(window.location.href, document.referrer)),
    );
  } catch {
    // Submission still receives a sanitized current-touch fallback.
  }
}

export function clearLeadAttribution() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function getLeadAttributionForSubmission(): LeadAttribution {
  if (typeof window === "undefined") {
    return deriveLeadAttribution("https://d2dmktg.com/", "");
  }
  try {
    const stored = window.sessionStorage.getItem(storageKey);
    if (stored) return JSON.parse(stored) as LeadAttribution;
  } catch {
    // Fall back to the current page and referrer below.
  }
  return deriveLeadAttribution(window.location.href, document.referrer);
}
