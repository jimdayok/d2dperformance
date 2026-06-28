import {
  ArrowRight,
  BriefcaseBusiness,
  Handshake,
  Sparkles,
  Target,
} from "lucide-react";
import { ButtonLink } from "@/components/button-link";

export function HomeHero() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-18">
      <div className="editorial-frame overflow-hidden p-6 md:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-8 rounded-[2rem] bg-[color:color-mix(in_oklab,var(--color-accent)_18%,white)] p-8 md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[var(--color-accent)]">
              Executive Performance Consulting
            </p>
            <div className="space-y-6">
              <h1 className="font-display max-w-5xl text-balance text-5xl font-semibold tracking-[-0.05em] text-[var(--color-taupe)] md:text-7xl">
                Build a Better Business. Not Just Better Marketing.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)] md:text-xl">
                D2D Performance helps leadership teams clarify their vision,
                strengthen their brand, improve execution, and accelerate
                profitable growth.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <ButtonLink href="/contact">
                <span className="inline-flex items-center gap-2">
                  Schedule Discovery
                  <ArrowRight className="h-4 w-4" />
                </span>
              </ButtonLink>
              <ButtonLink href="/brand-development" variant="secondary">
                Build Your Brand
              </ButtonLink>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: Handshake, label: "Relationship-first" },
                { icon: Target, label: "Clarity before creative" },
                { icon: BriefcaseBusiness, label: "Built for execution" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm font-medium text-[var(--color-ink)]"
                >
                  <Icon className="h-4 w-4 text-[var(--color-accent)]" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-taupe)]">
              Built on the DAY2DAY brand foundation with a sharper executive
              advisory position.
            </p>
          </div>

          <div className="grid gap-5">
            <div className="photo-placeholder photo-placeholder-one flex min-h-[360px] items-end overflow-hidden rounded-[2rem] p-6">
              <div className="max-w-sm rounded-[1.5rem] bg-[color:color-mix(in_oklab,var(--color-card)_88%,transparent)] p-5 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
                  Branding Lives In The Day2Day
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-ink)]">
                  Practical strategy, warmer presentation, and stronger systems
                  for companies that want their brand to finally match the
                  quality of the business.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[1.85rem] bg-[var(--color-charcoal)] p-7 text-white">
                <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-sand)]">
                  Brand Foundation
                </p>
                <p className="mt-4 text-lg leading-8 text-white/80">
                  DAY2DAY already stands for practical partnership and real-world
                  brand strategy. D2D Performance extends that trust into higher
                  level business consulting.
                </p>
              </div>
              <div className="rounded-[1.85rem] border border-[var(--color-border)] bg-[var(--color-card)] p-7">
                <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                  <Sparkles className="h-4 w-4" />
                  Advisory Focus
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    "Strategy",
                    "Leadership",
                    "Systems",
                    "Brand Clarity",
                    "Execution",
                    "Accountability",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-ink)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
