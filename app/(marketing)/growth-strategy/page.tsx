import { PageIntro } from "@/components/page-intro";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Growth Strategy",
  description:
    "Growth strategy advisory for established businesses that need disciplined, profitable expansion.",
  path: "/growth-strategy",
});

export default function GrowthStrategyPage() {
  return (
    <>
      <PageIntro
        eyebrow="Growth Strategy"
        title="Profitable growth requires more than activity."
        description="We help leadership teams connect market opportunity, sales execution, brand position, and operational readiness into a strategy the business can actually carry."
        primaryCta={{ href: "/#brand-discovery", label: "Start Brand Discovery" }}
      />
      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <article className="rounded-[2rem] bg-[var(--color-charcoal)] p-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-sand)]">
              Growth lens
            </p>
            <p className="mt-4 text-base leading-8 text-white/76">
              Growth should not make the company feel more chaotic. The point
              is to improve focus, convert demand more effectively, and scale
              with better commercial and operational support.
            </p>
          </article>
          <article className="editorial-frame p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
              What this usually touches
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                "Offer and market focus",
                "Sales process ownership",
                "Brand confidence and differentiation",
                "Execution readiness across operations",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5 text-sm leading-7 text-[var(--color-muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {[
            "Clarify which growth bets deserve focus now.",
            "Align sales, marketing, and operations around the same priorities.",
            "Reduce reactive decision-making and strengthen planning discipline.",
            "Create a practical roadmap for the next stage of the business.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[1.75rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-card)_94%,transparent)] px-6 py-7 text-lg leading-8 text-[var(--color-ink)]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
