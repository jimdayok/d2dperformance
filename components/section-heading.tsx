type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="max-w-3xl space-y-4">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-accent)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-balance text-4xl font-semibold tracking-[-0.03em] text-[var(--color-taupe)] md:text-6xl">
        {title}
      </h2>
      {description ? (
        <p className="text-lg leading-8 text-[var(--color-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
