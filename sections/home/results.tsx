import { LineChart, ShieldCheck, TrendingUp, UsersRound } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

export function ResultsSection() {
  const proofAreas = [
    {
      title: "Revenue Clarity",
      description:
        "Clearer priorities, stronger offers, and cleaner commercial focus become visible first in reporting discipline.",
      icon: TrendingUp,
    },
    {
      title: "Customer Retention",
      description:
        "A stronger brand promise and more consistent customer experience create the conditions for longer relationships.",
      icon: UsersRound,
    },
    {
      title: "Sales Performance",
      description:
        "Better positioning and better process give teams language, confidence, and ownership throughout the pipeline.",
      icon: LineChart,
    },
    {
      title: "Operational Efficiency",
      description:
        "Leadership rhythm, accountability, and systems reduce friction so growth does not feel chaotic.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <SectionHeading
        eyebrow="Results"
        title="Performance metrics designed to become proof."
        description="These are placeholders for the outcomes D2D Performance will ultimately document in case studies, scorecards, and client reporting."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {proofAreas.map((result) => {
          const Icon = result.icon;

          return (
            <article
              key={result.title}
              className="rounded-[1.9rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-card)_94%,transparent)] p-8 shadow-[0_18px_45px_rgba(16,24,34,0.06)]"
            >
              <Icon className="h-5 w-5 text-[var(--color-accent)]" />
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                Example outcome area
              </p>
              <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.03em] text-[var(--color-taupe)]">
                {result.title}
              </h3>
              <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
                {result.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
