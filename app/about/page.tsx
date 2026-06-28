import { ArrowRight, MonitorCog, Sparkles, UserRound } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { PageIntro } from "@/components/page-intro";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "About",
  description:
    "Learn how D2D Performance approaches executive advising with clarity, discipline, and practical business judgment.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About"
        title="Trusted executive advisors for companies that need sharper operating clarity."
        description="D2D Performance is positioned as a business performance partner for leaders who want practical thinking, honest perspective, and better execution across strategy, leadership, and brand."
      />
      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="editorial-frame p-8">
            <h2 className="font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--color-taupe)]">
              What D2D Performance believes
            </h2>
            <p className="mt-5 text-base leading-8 text-[var(--color-muted)]">
              Businesses do not scale on ambition alone. They scale when
              leadership alignment, strategic clarity, operating systems, and
              market credibility reinforce one another. That is where D2D
              Performance works.
            </p>
          </article>
          <article className="rounded-[2rem] bg-[var(--color-charcoal)] p-8 text-white">
            <h2 className="font-display text-4xl font-semibold tracking-[-0.03em]">
              What D2D Performance is not
            </h2>
            <p className="mt-5 text-base leading-8 text-white/75">
              It is not positioned as a generic marketing agency. Marketing can
              matter, but only when it is anchored to a stronger business
              strategy and a leadership team capable of executing it well.
            </p>
          </article>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <article className="editorial-frame p-8">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
              <UserRound className="h-4 w-4" />
              Andrea Day
            </p>
            <h3 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--color-taupe)]">
              Strategy, messaging, and brand direction.
            </h3>
            <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
              Andrea brings more than 25 years of experience across industries,
              with a focus on strategic marketing direction, innovative
              thinking, key messaging, visually effective campaigns, and brand
              systems built for real-world use.
            </p>
          </article>
          <article className="editorial-frame p-8">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
              <MonitorCog className="h-4 w-4" />
              Jim Day
            </p>
            <h3 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--color-taupe)]">
              Systems, digital execution, and platform build quality.
            </h3>
            <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
              Jim brings a systems-first lens to digital execution, shaping
              cleaner user experiences, stronger platform architecture, and the
              type of production quality visible in complex web experiences like
              Artisan Lab Network.
            </p>
          </article>
        </div>

        <div className="mt-8 rounded-[2rem] bg-[color:color-mix(in_oklab,var(--color-accent)_18%,white)] p-8">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
            <Sparkles className="h-4 w-4" />
            Better Together
          </p>
          <h3 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--color-taupe)]">
            Senior-level strategy paired with cleaner digital execution.
          </h3>
          <p className="mt-4 max-w-4xl text-base leading-8 text-[var(--color-muted)]">
            D2D Performance is strongest when brand thinking and build quality
            work together. That means clearer positioning, better customer
            experience, and business tools that do not fall apart the moment the
            strategy needs to be executed.
          </p>
          <div className="mt-6">
            <ButtonLink href="/contact">
              <span className="inline-flex items-center gap-2">
                Start a Discovery Conversation
                <ArrowRight className="h-4 w-4" />
              </span>
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
