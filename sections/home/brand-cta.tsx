import { ArrowRight, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/button-link";

export function BrandCtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <div className="overflow-hidden rounded-[2.25rem] border border-[var(--color-border)] bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-accent)_16%,var(--color-surface)),color-mix(in_oklab,var(--color-card)_96%,transparent))] px-8 py-14 shadow-[0_24px_60px_rgba(16,24,34,0.08)] md:px-12">
        <div className="grid items-center gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="rounded-[1.85rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-surface)_82%,transparent)] p-8 backdrop-blur-sm">
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
              <Sparkles className="h-4 w-4" />
              Brand Development
            </p>
            <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
              Your business already has a story. This process helps uncover it,
              organize it, and turn it into a usable brand blueprint.
            </p>
          </div>
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-accent)]">
              Build Brand Awareness Before You Market It
            </p>
            <h2 className="mt-4 font-display text-balance text-4xl font-semibold tracking-[-0.03em] text-[var(--color-taupe)] md:text-6xl">
              Every engagement starts with understanding the business.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
              Before we design, write, build, or promote anything, we clarify
              the business underneath it: the customer, the offer, the story,
              the positioning, and the growth plan.
            </p>
            <div className="mt-8">
              <ButtonLink href="/brand-development#brand-discovery">
                <span className="inline-flex items-center gap-2">
                Start Brand Discovery
                  <ArrowRight className="h-4 w-4" />
                </span>
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
