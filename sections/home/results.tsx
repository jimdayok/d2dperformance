import { LineChart, ShieldCheck, TrendingUp, UsersRound } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

export function ResultsSection() {
  const proofAreas = [
    {
      title: "Revenue Focus",
      description:
        "Track whether priorities, offers, and commercial effort are concentrating attention on the right opportunities.",
      icon: TrendingUp,
    },
    {
      title: "Customer Retention",
      description:
        "Watch the consistency of the customer experience and the strength of the relationships the business keeps.",
      icon: UsersRound,
    },
    {
      title: "Sales Performance",
      description:
        "Measure how positioning, process, confidence, and ownership show up throughout the pipeline.",
      icon: LineChart,
    },
    {
      title: "Operational Efficiency",
      description:
        "Look for reduced friction, stronger accountability, and systems that make responsible growth easier to absorb.",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="performance-scorecard mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <SectionHeading
        eyebrow="The Scorecard"
        title="Define what better means before measuring it."
        description="The right measures depend on the business and the engagement. These are operating areas D2D can help leadership teams define, track, and improve—without pretending one score fits every company."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {proofAreas.map((result) => {
          const Icon = result.icon;

          return (
            <article
              key={result.title}
              className="performance-scorecard-card rounded-[1.9rem] border border-[var(--color-border)] p-8"
            >
              <Icon className="h-5 w-5 text-[var(--color-accent)]" />
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                Operating measure
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
