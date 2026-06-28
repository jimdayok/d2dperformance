import { SectionHeading } from "@/components/section-heading";
import { results } from "@/lib/site-data";

export function ResultsSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <SectionHeading
        eyebrow="Results"
        title="Performance metrics designed to be edited as proof accumulates."
        description="These are placeholders for the outcomes D2D Performance will ultimately document in case studies, scorecards, and client reporting."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {results.map((result) => (
          <article
            key={result.label}
            className="rounded-[1.75rem] bg-[var(--color-ink)] p-8 text-white"
          >
            <p className="text-sm uppercase tracking-[0.24em] text-white/55">
              {result.label}
            </p>
            <p className="mt-6 text-4xl font-semibold tracking-[-0.04em]">
              {result.value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
