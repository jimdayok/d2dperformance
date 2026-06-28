import { SectionHeading } from "@/components/section-heading";
import { serviceCards } from "@/lib/site-data";

export function WhatWeDoSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <SectionHeading
        eyebrow="What We Do"
        title="Performance consulting for businesses that need better leadership and sharper execution."
        description="We work at the business level first, then use brand, marketing, and sales as tools inside a larger growth strategy."
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {serviceCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[2rem] border border-[var(--color-border)] bg-white p-8 shadow-[0_18px_60px_rgba(31,41,51,0.05)]"
          >
            <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
              {card.title}
            </h3>
            <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
              {card.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
