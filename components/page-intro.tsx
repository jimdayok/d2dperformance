import { ButtonLink } from "@/components/button-link";
import { SectionHeading } from "@/components/section-heading";

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
      <div className="editorial-frame overflow-hidden px-8 py-16 md:px-12">
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
          <div className="rounded-[2rem] bg-[color:color-mix(in_oklab,var(--color-accent)_16%,white)] p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
              D2D Perspective
            </p>
            <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
              Strategic work should feel practical, warm, and commercially
              useful. Every page in D2D Performance is being shaped to reflect
              that same DAY2DAY foundation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
