import type { Metric } from "./model";

export const clientMetrics: Record<
  string,
  { label: string; explanation: string; unit: string }
> = {
  organic_clicks: {
    label: "Visits from Google search",
    explanation:
      "People who clicked through to your website from an unpaid Google search result.",
    unit: "",
  },
  search_impressions: {
    label: "Times you appeared in Google",
    explanation:
      "How often a link to your website appeared in Google search results. An appearance is not a website visit.",
    unit: "",
  },
  search_ctr: {
    label: "Searchers who chose your website",
    explanation:
      "The share of search-result appearances that led to a click to your website.",
    unit: "%",
  },
  search_position: {
    label: "Your average place in Google results",
    explanation:
      "A broad average across searches, rather than a fixed ranking. A smaller number usually means your result appeared closer to the top.",
    unit: "",
  },
  ai_mentions: {
    label: "AI answers that mentioned you",
    explanation:
      "The share of the questions we tested where an AI assistant named your business. This describes our test only, not every AI answer.",
    unit: "%",
  },
  ai_citations: {
    label: "AI answers that linked to your website",
    explanation:
      "The share of the questions we tested where an AI assistant included your website as a source.",
    unit: "%",
  },
  users: {
    label: "People who visited your website",
    explanation:
      "The number of people counted by your website's visitor tracking. It is an estimate, and one person can be counted on more than one device.",
    unit: "",
  },
  sessions: {
    label: "Website visits",
    explanation:
      "A person can visit more than once, so visits and people are different numbers.",
    unit: "",
  },
  engagement_rate: {
    label: "Visits with meaningful activity",
    explanation:
      "The share of visits that met the website tracking rules for meaningful activity, such as spending time, viewing more than one page, or taking an important action.",
    unit: "%",
  },
  views: {
    label: "Pages people looked at",
    explanation: "The total number of page views, including repeat views.",
    unit: "",
  },
  leads: {
    label: "Confirmed customer inquiries",
    explanation:
      "Inquiries checked against the agreed definition of a potential customer, with duplicate records removed.",
    unit: "",
  },
  forms: {
    label: "Completed inquiry forms",
    explanation:
      "Forms successfully submitted. These may already be included in confirmed inquiries, so they are not added together.",
    unit: "",
  },
  calls: {
    label: "Tracked phone calls",
    explanation:
      "Calls counted by the connected call-tracking service. Clicking a phone number alone does not confirm a completed call.",
    unit: "",
  },
  bookings: {
    label: "Completed bookings",
    explanation:
      "Appointments or reservations confirmed by the booking service. These may overlap with other inquiry counts.",
    unit: "",
  },
  conversion_rate: {
    label: "Visits that became customer inquiries",
    explanation:
      "Confirmed inquiries divided by website visits, using the agreed counting rules.",
    unit: "%",
  },
  lcp: {
    label: "How quickly the main content appears",
    explanation:
      "How long visitors waited for the largest main item on a page to appear. Less time is generally better.",
    unit: " sec",
  },
  inp: {
    label: "How quickly the website responds",
    explanation:
      "How long visitors waited after clicking, tapping or typing. Less time is generally better.",
    unit: " ms",
  },
  cls: {
    label: "How steady the page stays",
    explanation:
      "A measure of unexpected movement while a page loads. A smaller result generally means less jumping around.",
    unit: "",
  },
  indexable_pages: {
    label: "Pages search engines can include",
    explanation:
      "Pages our checks found eligible to appear in search. Eligibility does not guarantee that Google will include them.",
    unit: "",
  },
};
export function clientValue(metric?: Metric) {
  if (metric?.status === "not_applicable") return "Not applicable";
  if (!metric || metric.status === "missing" || metric.value === null)
    return "Not measured";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: metric.key === "cls" ? 3 : 2 }).format(metric.value)}${clientMetrics[metric.key]?.unit ?? ""}`;
}
export function clientChange(current: Metric, previous?: Metric) {
  if (
    current.status !== "verified" ||
    current.value === null ||
    previous?.status !== "verified" ||
    previous.value === null
  )
    return "We need both periods to show a change.";
  if (current.source !== previous.source || current.method !== previous.method)
    return "The way this was measured changed, so the results cannot be compared fairly.";
  const difference = current.value - previous.value;
  if (difference === 0) return "No change in the recorded result.";
  const amount = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: current.key === "cls" ? 3 : 2,
  }).format(Math.abs(difference));
  if (clientMetrics[current.key]?.unit === "%")
    return `${amount} percentage ${Math.abs(difference) === 1 ? "point" : "points"} ${difference > 0 ? "higher" : "lower"}.`;
  return `${amount}${clientMetrics[current.key]?.unit ?? ""} ${difference > 0 ? "more" : "less"} than last month.`;
}
