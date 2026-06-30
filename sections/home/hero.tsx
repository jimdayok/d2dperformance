import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/button-link";

export function HomeHero() {
  return (
    <section className="mx-auto max-w-[88rem] px-6 pt-28 pb-14 lg:px-8 lg:pt-36 lg:pb-18">
      <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
        <div>
          <p className="eyebrow-label">Brand Discovery</p>
          <h1 className="mt-6 max-w-5xl font-display text-[clamp(3.2rem,8vw,7.6rem)] leading-[0.92] tracking-[-0.065em] text-[var(--color-ink)]">
            Start here.
            <br />
            Answer the full discovery
            <br />
            before anything else.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
            D2D starts with the complete brand discovery. It is the first thing we want people
            to do when they arrive, because it gives us the business, customer, market, story,
            and growth context before strategy turns into opinions.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <ButtonLink href="#brand-discovery">
              <span className="inline-flex items-center gap-2">
                Start Brand Discovery
                <ArrowRight className="h-4 w-4" />
              </span>
            </ButtonLink>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Exact 40-question discovery
            </p>
          </div>
        </div>

        <div className="paper-panel operating-lines rounded-[1.6rem] px-7 py-8">
          <p className="eyebrow-label">What Happens</p>
          <div className="mt-6 space-y-6">
            {[
              "You answer the full discovery in a guided sequence.",
              "Each completed section is emailed to Jim and Andrea as progress.",
              "The final submission becomes the starting point for the engagement.",
            ].map((item, index) => (
              <div
                key={item}
                className="grid gap-3 border-t border-[var(--color-border)] pt-5 md:grid-cols-[4rem_minmax(0,1fr)]"
              >
                <span className="font-display text-4xl tracking-[-0.06em] text-[color:color-mix(in_oklab,var(--color-accent)_48%,white)]">
                  0{index + 1}
                </span>
                <p className="text-base leading-8 text-[var(--color-muted)]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
