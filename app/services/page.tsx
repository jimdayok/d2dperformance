import { ArrowRight, Compass, Layers3, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { PageIntro } from "@/components/page-intro";
import { createMetadata } from "@/lib/metadata";
import { servicesPageItems } from "@/lib/site-data";

export const metadata = createMetadata({
  title: "Services",
  description:
    "Explore D2D Performance services across executive coaching, growth strategy, and brand development.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Services"
        title="Advisory services built around business performance."
        description="Each engagement is designed to solve strategic, operational, and leadership problems that keep companies from scaling well."
        primaryCta={{ href: "/contact", label: "Schedule Discovery" }}
        secondaryCta={{ href: "/brand-development", label: "Build Your Brand" }}
      />
      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {[Compass, Layers3, Sparkles].map((Icon, idx) => {
            const service = servicesPageItems[idx];
            return (
            <article
              key={service.slug}
              className="editorial-frame p-8"
            >
              <Icon className="h-5 w-5 text-[var(--color-accent)]" />
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
                {service.title}
              </p>
              <p className="mt-5 text-base leading-7 text-[var(--color-muted)]">
                {service.overview}
              </p>
              <div className="mt-8 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-ink)]">
                    Problems Solved
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                    {service.problems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-ink)]">
                    Deliverables
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                    {service.deliverables.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-ink)]">
                    Ideal Customer
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    {service.idealCustomer}
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <ButtonLink href={service.cta}>
                  <span className="inline-flex items-center gap-2">
                    Learn More
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </ButtonLink>
              </div>
            </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
