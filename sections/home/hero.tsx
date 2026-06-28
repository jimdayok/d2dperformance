import { ArrowRight, Handshake, Target, Wrench } from "lucide-react";
import { ButtonLink } from "@/components/button-link";

export function HomeHero() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-12 pt-10 lg:px-8 lg:pb-18 lg:pt-14">
      <div className="editorial-frame overflow-hidden px-6 py-8 md:px-10 md:py-10 lg:px-14 lg:py-14">
        <div className="grid items-end gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="max-w-3xl space-y-8">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[var(--color-accent)] md:text-[0.95rem]">
              Executive Performance Consulting
            </p>
            <div className="space-y-5">
              <h1 className="font-display max-w-4xl text-balance text-[clamp(2.95rem,8vw,6.6rem)] leading-[0.95] font-semibold tracking-[-0.055em] text-[var(--color-taupe)]">
                Build a better business.
                <br />
                Not just better marketing.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)] md:text-[1.2rem]">
                D2D Performance helps leadership teams clarify vision,
                strengthen brand, improve execution, and accelerate profitable
                growth.
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
            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { icon: Handshake, label: "Relationship-first" },
                { icon: Target, label: "Clarity before creative" },
                { icon: Wrench, label: "Built for execution" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-card)_88%,transparent)] px-4 py-3 text-sm font-medium text-[var(--color-ink)] backdrop-blur-sm"
                >
                  <Icon className="h-4 w-4 text-[var(--color-accent)]" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5">
            <div className="photo-placeholder photo-placeholder-one flex min-h-[420px] items-end overflow-hidden rounded-[2rem] border border-[var(--color-border)] p-6 shadow-[0_30px_80px_rgba(16,24,34,0.12)]">
              <div className="max-w-sm rounded-[1.5rem] border border-white/15 bg-[color:color-mix(in_oklab,var(--color-card)_84%,transparent)] p-5 backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
                  Strategy-first. Practical. Built for execution.
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--color-ink)]">
                  Premium consulting support for companies that need sharper
                  leadership, stronger brand clarity, and real operating
                  momentum.
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  label: "Brand",
                  value: "Clarity before creative",
                },
                {
                  label: "Leadership",
                  value: "Executive-level accountability",
                },
                {
                  label: "Execution",
                  value: "Systems that support growth",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.5rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-card)_92%,transparent)] px-5 py-5 backdrop-blur-sm"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                    {item.label}
                  </p>
                  <p className="mt-3 text-base leading-7 text-[var(--color-ink)]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="rounded-[1.85rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-surface)_78%,transparent)] p-7">
              <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-accent)]">
                Built on the DAY2DAY foundation
              </p>
              <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
                The visual language stays warm and grounded. The positioning
                moves up-market with a sharper advisory lens for owners,
                founders, and leadership teams.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
