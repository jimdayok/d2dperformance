"use client";

import { useEffect, useState } from "react";
import { safeJsonParse } from "@/lib/brand-discovery-storage";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        const parsed = safeJsonParse<T>(stored, initialValue);

        queueMicrotask(() => {
          if (!cancelled) {
            setValue(parsed);
          }
        });
      }
    } catch {
      // Ignore malformed localStorage payloads and fall back to defaults.
    } finally {
      queueMicrotask(() => {
        if (!cancelled) {
          setHydrated(true);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [initialValue, key]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  }, [hydrated, key, value]);

  return { hydrated, value, setValue };
}
