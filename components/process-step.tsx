type ProcessStepProps = {
  index: number;
  title: string;
  description: string;
};

export function ProcessStep({ index, title, description }: ProcessStepProps) {
  return (
    <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
        0{index}
      </p>
      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
        {description}
      </p>
    </article>
  );
}
