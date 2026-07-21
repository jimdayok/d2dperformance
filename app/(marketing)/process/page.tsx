import { PageIntro } from "@/components/page-intro";
import { createMetadata } from "@/lib/metadata";
import { processSteps } from "@/lib/site-data";

export const metadata = createMetadata({
  title: "Process",
  description:
    "See the D2D Performance engagement process from discovery through optimization.",
  path: "/process",
});

export default function ProcessPage() {
  return (
    <>
      <PageIntro
        eyebrow="Process"
        title="A consulting process designed to create clarity before motion."
        description="Every stage is meant to reduce noise, sharpen decisions, and build stronger follow-through across leadership, brand, and the commercial side of the business."
        primaryCta={{ href: "/#brand-discovery", label: "Start Brand Discovery" }}
      />
      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <article className="rounded-[2rem] bg-[var(--color-charcoal)] p-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-sand)]">
              Why the sequence matters
            </p>
            <p className="mt-4 text-base leading-8 text-white/76">
              Most companies skip steps. They execute before they define,
              market before they position, and push growth before operations
              are ready. The D2D process exists to correct that pattern.
            </p>
          </article>
          <article className="editorial-frame p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
              What clients can expect
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                "Honest strategic conversation",
                "Clear priorities and decision criteria",
                "Defined ownership and follow-through",
                "A process built to support actual implementation",
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
        <div className="grid gap-5">
          {processSteps.map((step, index) => (
            <article
              key={step.title}
              className="grid gap-4 rounded-[1.75rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-card)_94%,transparent)] p-8 md:grid-cols-[120px_1fr]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
                Step 0{index + 1}
              </p>
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                  {step.title}
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-muted)]">
                  {step.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
