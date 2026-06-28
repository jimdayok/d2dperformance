import { ButtonLink } from "@/components/button-link";

export function HomeHero() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-6 py-18 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
      <div className="space-y-8">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[var(--color-accent)]">
          Executive Performance Consulting
        </p>
        <div className="space-y-6">
          <h1 className="max-w-5xl text-balance text-5xl font-semibold tracking-[-0.05em] text-[var(--color-ink)] md:text-7xl">
            Build a Better Business. Not Just Better Marketing.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-[var(--color-muted)] md:text-xl">
            D2D Performance helps leadership teams clarify their vision,
            strengthen their brand, improve execution, and accelerate
            profitable growth.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <ButtonLink href="/contact">Schedule Discovery</ButtonLink>
          <ButtonLink href="/brand-development" variant="secondary">
            Build Your Brand
          </ButtonLink>
        </div>
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-taupe)]">
          Built on the DAY2DAY brand foundation with a sharper executive advisory position.
        </p>
      </div>

      <div className="grid gap-4 self-end">
        <div className="rounded-[2rem] border border-[var(--color-border)] bg-white p-8 shadow-[0_24px_80px_rgba(31,41,51,0.06)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
            Advisory Focus
          </p>
          <div className="mt-6 space-y-4">
            {[
              "Strategy",
              "Leadership",
              "Systems",
              "Brand Clarity",
              "Execution",
              "Accountability",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-ink)]"
              >
                <span>{item}</span>
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[2rem] bg-[var(--color-ink)] p-8 text-white">
          <p className="text-sm uppercase tracking-[0.24em] text-[var(--color-sand)]">
            Brand Foundation
          </p>
          <p className="mt-3 text-lg leading-8 text-white/80">
            The existing DAY2DAY brand already emphasizes clarity, practical
            partnership, and support for the real day-to-day of business. D2D
            Performance extends that foundation into a more premium consulting
            offer for owners and executive teams.
          </p>
        </div>
      </div>
    </section>
  );
}
