import type { DiscoveryDraft } from "@/types/brand-discovery";

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value || !value.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadDraft(storageKey: string, fallback: DiscoveryDraft): DiscoveryDraft {
  if (typeof window === "undefined") {
    return fallback;
  }

  const parsed = safeJsonParse<DiscoveryDraft>(
    window.localStorage.getItem(storageKey),
    fallback,
  );

  return {
    ...fallback,
    ...parsed,
    answers: {
      ...fallback.answers,
      ...(parsed.answers ?? {}),
    },
  };
}

export function saveDraft(storageKey: string, draft: DiscoveryDraft) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(draft));
}

export function clearDraft(storageKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(storageKey);
}
