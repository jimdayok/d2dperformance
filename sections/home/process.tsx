import { SectionHeading } from "@/components/section-heading";
import { processSteps } from "@/lib/site-data";

export function HomeProcessSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <div className="performance-playbook rounded-[2.25rem] border border-[var(--color-border)] px-6 py-10 md:px-8 lg:px-10">
        <SectionHeading
          eyebrow="The Playbook"
          title="A repeatable progression from potential to performance."
          description="Every engagement begins with a clear baseline, then moves through a practical operating sequence designed to create focus, ownership, and continuous improvement."
        />
        <div className="mt-10 grid gap-5 xl:grid-cols-5">
          {processSteps.map((step, index) => (
            <article
              key={step.title}
              className="rounded-[1.6rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-surface)_86%,transparent)] p-6"
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
      </div>
    </section>
  );
}
