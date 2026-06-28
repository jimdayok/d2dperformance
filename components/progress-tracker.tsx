import { Check, Clock3 } from "lucide-react";
import { isSectionComplete } from "@/lib/brand-report";
import type { DiscoveryFormValues, DiscoverySection } from "@/types/brand-discovery";

type ProgressTrackerProps = {
  sections: DiscoverySection[];
  currentSectionIndex: number;
  answers: DiscoveryFormValues;
  onSelect: (index: number) => void;
  estimatedRemainingMinutes: number;
};

export function ProgressTracker({
  sections,
  currentSectionIndex,
  answers,
  onSelect,
  estimatedRemainingMinutes,
}: ProgressTrackerProps) {
  const completion = Math.round(
    ((currentSectionIndex + 1) / sections.length) * 100,
  );

  return (
    <aside className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-panel)] p-6 lg:sticky lg:top-24">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
        Discovery Progress
      </p>
      <div className="mt-4 flex items-center justify-between">
        <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
          Guided Interview
        </h3>
        <span className="text-sm font-medium text-[var(--color-muted)]">
          {completion}%
        </span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-[var(--color-border-soft)]">
        <div
          className="h-2 rounded-full bg-[var(--color-accent)] transition-all"
          style={{ width: `${completion}%` }}
        />
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Clock3 className="h-4 w-4" />
        <span>{estimatedRemainingMinutes} minutes remaining</span>
      </div>

      <div className="mt-6 space-y-2">
        {sections.map((section, index) => {
          const complete =
            section.questions.length === 0
              ? currentSectionIndex > index
              : isSectionComplete(section, answers);
          const active = currentSectionIndex === index;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(index)}
              className={`flex w-full items-center justify-between rounded-[1.25rem] px-4 py-3 text-left transition ${
                active
                  ? "bg-[var(--color-card)] text-[var(--color-ink)] shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-card)]/70 hover:text-[var(--color-ink)]"
              }`}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.2em]">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-1 text-sm font-medium">{section.title}</p>
              </div>
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                  complete
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-[var(--color-border-strong)]"
                }`}
              >
                {complete ? <Check className="h-3.5 w-3.5" /> : null}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
