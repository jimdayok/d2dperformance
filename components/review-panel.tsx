import { brandDiscoverySections } from "@/lib/brand-discovery-data";
import type { DiscoveryFormValues } from "@/types/brand-discovery";

type ReviewPanelProps = {
  answers: DiscoveryFormValues;
  summaries: Record<string, string[]>;
  onEdit: (index: number) => void;
};

function answerToString(value: unknown) {
  if (typeof value === "string") {
    return value || "Not provided";
  }

  if (typeof value === "number") {
    return `${value}`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "Not provided";
    }

    if (typeof value[0] === "string") {
      return (value as string[]).join(", ");
    }

    return (value as Array<{ name: string }>).map((file) => file.name).join(", ");
  }

  return "Not provided";
}

export function ReviewPanel({
  answers,
  summaries,
  onEdit,
}: ReviewPanelProps) {
  return (
    <div className="space-y-6">
      {brandDiscoverySections.map((section, index) => (
        <article
          key={section.id}
          className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                Review
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                {section.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onEdit(index)}
              className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"
            >
              Edit section
            </button>
          </div>

          <div className="mt-5 rounded-[1.25rem] bg-[var(--color-panel)] p-4">
            <p className="text-sm font-semibold text-[var(--color-ink)]">
              Here&apos;s what we&apos;ve learned so far...
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
              {(summaries[section.id] ?? []).map((summary) => (
                <li key={summary}>{summary}</li>
              ))}
            </ul>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {section.questions.map((question) => (
              <div
                key={question.id}
                className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4"
              >
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  {question.label}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  {answerToString(answers[question.id])}
                </p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
