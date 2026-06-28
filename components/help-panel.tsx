"use client";

import { ChevronDown, Lightbulb } from "lucide-react";
import { useState } from "react";

type HelpPanelProps = {
  title: string;
  body?: string;
  examples?: string[];
  brandExamples?: string[];
};

export function HelpPanel({
  title,
  body,
  examples,
  brandExamples,
}: HelpPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-panel)]">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center justify-between px-4 py-4 text-left"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
          <Lightbulb className="h-4 w-4 text-[var(--color-accent)]" />
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[var(--color-muted)] transition ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen ? (
        <div className="border-t border-[var(--color-border)] px-4 py-4 text-sm leading-7 text-[var(--color-muted)]">
          {body ? <p>{body}</p> : null}
          {examples?.length ? (
            <div className="mt-3">
              <p className="font-semibold text-[var(--color-ink)]">Common answers</p>
              <ul className="mt-2 space-y-1">
                {examples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {brandExamples?.length ? (
            <div className="mt-3">
              <p className="font-semibold text-[var(--color-ink)]">Recognizable brand cues</p>
              <ul className="mt-2 space-y-1">
                {brandExamples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
