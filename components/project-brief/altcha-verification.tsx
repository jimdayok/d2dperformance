"use client";

import { useEffect, useRef, useState } from "react";

type Props = { onVerified?: (verified: boolean) => void };

export function AltchaVerification({ onVerified }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let cancelled = false;
    let widget: HTMLElement | undefined;
    onVerified?.(false);
    setLoadState("loading");
    const onStateChange = (event: Event) => {
      const state = (event as CustomEvent<{ state: string }>).detail?.state;
      onVerified?.(state === "verified");
    };
    void import("altcha").then(() => {
      if (cancelled) return;
      widget = document.createElement("altcha-widget");
      for (const [name, value] of Object.entries({
        challenge: "/api/marketing/challenge", name: "altcha", type: "checkbox",
        auto: "off", display: "standard", language: "en",
      })) widget.setAttribute(name, value);
      widget.addEventListener("statechange", onStateChange);
      host.replaceChildren(widget);
      setLoadState("ready");
    }).catch(() => {
      if (!cancelled) setLoadState("error");
    });
    return () => {
      cancelled = true;
      widget?.removeEventListener("statechange", onStateChange);
      host.replaceChildren();
    };
  }, [attempt, onVerified]);

  return (
    <div className="marketing-altcha">
      <p className="verification-label">Bot verification</p>
      <div ref={container} className="verification-control" />
      {loadState === "loading" ? <p role="status">Loading secure verification…</p> : null}
      {loadState === "error" ? (
        <p role="alert">Verification could not load. <button type="button" onClick={() => setAttempt(value => value + 1)}>Retry verification</button> or call <a href="tel:+12697887067">269-788-7067</a>.</p>
      ) : null}
      <small>Check “I&apos;m not a robot” before sending. Private verification, with no image puzzles.</small>
    </div>
  );
}
