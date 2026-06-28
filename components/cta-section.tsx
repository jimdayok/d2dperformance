import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { SectionShell } from "@/components/section-shell";

type CTASectionProps = {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function CTASection({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: CTASectionProps) {
  return (
    <SectionShell
      title={title}
      description={description}
      className="pb-24"
    >
      <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-panel)] p-8 md:p-12">
        <div className="flex flex-wrap gap-4">
          <ButtonLink href={primaryHref}>
            <span className="inline-flex items-center gap-2">
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </span>
          </ButtonLink>
          {secondaryHref && secondaryLabel ? (
            <ButtonLink href={secondaryHref} variant="secondary">
              {secondaryLabel}
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </SectionShell>
  );
}
