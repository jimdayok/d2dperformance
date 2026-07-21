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
        title="Advisory services built for leadership teams that have outgrown generic advice."
        description="Each engagement is designed to solve strategic, operational, commercial, and brand problems that keep solid companies from performing like stronger brands."
        primaryCta={{ href: "/#brand-discovery", label: "Start Brand Discovery" }}
        secondaryCta={{ href: "/brand-development#brand-discovery", label: "Open Discovery Page" }}
      />
      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <article className="rounded-[2rem] bg-[var(--color-charcoal)] p-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-sand)]">
              Advisory Model
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em]">
              Built around the business first.
            </h2>
            <p className="mt-4 text-base leading-8 text-white/75">
              D2D Performance works upstream of tactics. We clarify the
              business, the leadership decisions, the commercial message, and
              the operating rhythm before asking marketing or design to solve
              problems they cannot solve alone.
            </p>
          </article>
          <article className="editorial-frame p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
              Typical Engagement Themes
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                "Leadership alignment and cadence",
                "Growth strategy and market focus",
                "Brand positioning and customer confidence",
                "Sales messaging and commercial clarity",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5 text-sm leading-7 text-[var(--color-muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {[Compass, Layers3, Sparkles].map((Icon, idx) => {
            const service = servicesPageItems[idx];

            return (
              <article key={service.slug} className="editorial-frame p-8">
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
