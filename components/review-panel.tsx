import type {
  DiscoveryFormValues,
  DiscoverySection,
} from "@/types/brand-discovery";

type ReviewPanelProps = {
  answers: DiscoveryFormValues;
  sections: DiscoverySection[];
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
  sections,
  onEdit,
}: ReviewPanelProps) {
  return (
    <div className="space-y-6">
      {sections.map((section, index) =>
        section.questions.length === 0 ? null : (
        <article
          key={section.id}
          className="paper-panel rounded-[1.4rem] p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow-label">
                Review
              </p>
              <h3 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)]">
                {section.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onEdit(index)}
              className="border-b border-[var(--color-border-strong)] pb-1 text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Edit section
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {section.questions.map((question) => (
              <div
                key={question.id}
                className="border-t border-[var(--color-border)] px-1 py-4"
              >
                <p className="text-sm font-medium uppercase tracking-[0.08em] text-[var(--color-ink)]">
                  {question.label}
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                  {answerToString(answers[question.id])}
                </p>
              </div>
            ))}
          </div>
        </article>
        ),
      )}
    </div>
  );
}
