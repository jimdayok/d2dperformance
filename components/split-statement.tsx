type SplitStatementProps = {
  eyebrow: string;
  title: string;
  body: string;
};

export function SplitStatement({
  eyebrow,
  title,
  body,
}: SplitStatementProps) {
  return (
    <section className="px-6 py-20 lg:px-8 lg:py-28">
      <div className="section-rule mx-auto mb-12 max-w-[88rem]" />
      <div className="mx-auto grid max-w-[88rem] gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.68fr)] lg:gap-18">
        <div>
          <p className="eyebrow-label">{eyebrow}</p>
          <h2 className="mt-6 max-w-5xl font-display text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.96] tracking-[-0.06em] text-[var(--color-ink)]">
            {title}
          </h2>
        </div>
        <div className="lg:pt-18">
          <p className="max-w-xl text-lg leading-8 text-[var(--color-muted)]">
            {body}
          </p>
        </div>
      </div>
    </section>
  );
}
