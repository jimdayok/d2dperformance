import { BriefcaseBusiness, Compass, Layers3 } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { serviceCards } from "@/lib/site-data";

export function WhatWeDoSection() {
  const icons = [Compass, BriefcaseBusiness, Layers3];

  return (
    <section className="section-curve-top mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <SectionHeading
        eyebrow="What We Do"
        title="Performance consulting for businesses that need better leadership and sharper execution."
        description="We work at the business level first, then use brand, marketing, and sales as tools inside a larger growth strategy."
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {serviceCards.map((card, index) => {
          const Icon = icons[index];

          return (
            <article key={card.title} className="editorial-frame p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-[color:color-mix(in_oklab,var(--color-accent)_18%,white)] text-[var(--color-accent)]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-3xl font-semibold tracking-[-0.03em] text-[var(--color-taupe)]">
                {card.title}
              </h3>
              <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
                {card.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
