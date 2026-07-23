export type ReviewValue = string | number | boolean | null | ReviewValue[] | { [key: string]: ReviewValue };

export type ReviewChange = {
  path: string;
  label: string;
  before: ReviewValue | undefined;
  after: ReviewValue | undefined;
};

const isObject = (value: ReviewValue | undefined): value is { [key: string]: ReviewValue } =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function humanizePath(path: string) {
  return path
    .replaceAll(".", " / ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function valuesMatch(left: ReviewValue | undefined, right: ReviewValue | undefined) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function createReviewDiff(
  published: ReviewValue | undefined,
  draft: ReviewValue | undefined,
  labels: Record<string, string> = {},
): ReviewChange[] {
  const changes: ReviewChange[] = [];

  function compare(before: ReviewValue | undefined, after: ReviewValue | undefined, path: string) {
    if (isObject(before) || isObject(after)) {
      const beforeObject = isObject(before) ? before : {};
      const afterObject = isObject(after) ? after : {};
      const keys = Array.from(new Set([...Object.keys(beforeObject), ...Object.keys(afterObject)])).sort();
      for (const key of keys) compare(beforeObject[key], afterObject[key], path ? `${path}.${key}` : key);
      return;
    }

    if (!valuesMatch(before, after)) {
      changes.push({ path, label: labels[path] ?? humanizePath(path), before, after });
    }
  }

  compare(published, draft, "");
  return changes;
}

export function formatReviewValue(value: ReviewValue | undefined) {
  if (value === undefined || value === null || value === "") return "Not set";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value.join("\n");
  return JSON.stringify(value, null, 2);
}
