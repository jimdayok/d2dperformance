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
      <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-8 py-16 shadow-[0_24px_80px_rgba(31,41,51,0.06)] md:px-12">
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
    </section>
  );
}
