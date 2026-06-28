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
        primaryCta={{ href: "/contact", label: "Schedule Discovery" }}
      />
      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {[
            "Clarify which growth bets deserve focus now.",
            "Align sales, marketing, and operations around the same priorities.",
            "Reduce reactive decision-making and strengthen planning discipline.",
            "Create a practical roadmap for the next stage of the business.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-[1.75rem] border border-[var(--color-border)] bg-white px-6 py-7 text-lg leading-8 text-[var(--color-ink)]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
