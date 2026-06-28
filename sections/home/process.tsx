import { SectionHeading } from "@/components/section-heading";
import { processSteps } from "@/lib/site-data";

export function HomeProcessSection() {
  return (
    <section className="taupe-band mx-auto max-w-7xl rounded-[2.5rem] px-6 py-18 lg:px-8">
      <SectionHeading
        eyebrow="Our Process"
        title="A clear operating sequence for stronger businesses."
        description="Every engagement begins with understanding the business, then building the strategic and operational clarity required to scale it."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {processSteps.map((step, index) => (
          <article
            key={step.title}
            className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
              0{index + 1}
            </p>
            <h3 className="mt-4 font-display text-3xl font-semibold tracking-[-0.03em] text-[var(--color-taupe)]">
              {step.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              {step.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
