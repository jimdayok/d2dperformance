import { ButtonLink } from "@/components/button-link";
import { SectionHeading } from "@/components/section-heading";
import { operatingPrinciples } from "@/lib/site-data";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

export function PageIntro({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
}: PageIntroProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 pt-16 lg:px-8 lg:pt-24">
      <div className="editorial-frame overflow-hidden px-8 py-14 md:px-12">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div>
            <SectionHeading eyebrow={eyebrow} title={title} description={description} />
            {primaryCta || secondaryCta ? (
              <div className="mt-8 flex flex-wrap gap-4">
                {primaryCta ? (
                  <ButtonLink href={primaryCta.href}>{primaryCta.label}</ButtonLink>
                ) : null}
                {secondaryCta ? (
                  <ButtonLink href={secondaryCta.href} variant="secondary">
                    {secondaryCta.label}
                  </ButtonLink>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-card)_92%,transparent)] p-8 shadow-[0_18px_45px_rgba(16,24,34,0.05)] backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
              D2D Perspective
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] text-[var(--color-taupe)]">
              Practical strategy with a stronger operating lens.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
              The brand language stays warm and grounded. The work itself moves
              up-market with sharper thinking around leadership, growth,
              customer experience, and execution.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {operatingPrinciples.slice(0, 4).map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
