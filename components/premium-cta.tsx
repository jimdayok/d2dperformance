import Link from "next/link";

export function PremiumCTA() {
  return (
    <section className="px-6 pt-10 pb-24 lg:px-8 lg:pb-30">
      <div className="section-rule mx-auto mb-12 max-w-[88rem]" />
      <div className="mx-auto grid max-w-[88rem] gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="eyebrow-label">Start There</p>
          <h2 className="mt-5 max-w-4xl font-display text-[clamp(2.6rem,6vw,5.6rem)] leading-[0.96] tracking-[-0.06em] text-[var(--color-ink)]">
            If the business feels heavier than it should, start there.
          </h2>
        </div>
        <div className="lg:pt-20">
          <Link
            href="/contact"
            className="inline-flex items-center border-b border-[var(--color-border-strong)] pb-2 text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Schedule a discovery conversation
          </Link>
          <p className="mt-5 text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Dallas-Fort Worth based. Advisory work by appointment.
          </p>
        </div>
      </div>
    </section>
  );
}
