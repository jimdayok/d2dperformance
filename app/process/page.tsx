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
        description="Every stage of the engagement is meant to reduce noise, sharpen decisions, and improve execution across the business."
      />
      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
        <div className="grid gap-5">
          {processSteps.map((step, index) => (
            <article
              key={step.title}
              className="grid gap-4 rounded-[1.75rem] border border-[var(--color-border)] bg-white p-8 md:grid-cols-[120px_1fr]"
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
