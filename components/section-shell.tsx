type SectionShellProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
  className = "",
}: SectionShellProps) {
  return (
    <section id={id} className={`mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20 ${className}`}>
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-accent)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.04em] text-[var(--color-ink)] md:text-5xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-5 text-lg leading-8 text-[var(--color-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-10">{children}</div>
    </section>
  );
}
