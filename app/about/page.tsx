import {
  ArrowRight,
  BriefcaseBusiness,
  Handshake,
  MonitorCog,
  Sparkles,
  UserRound,
} from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { PageIntro } from "@/components/page-intro";
import { createMetadata } from "@/lib/metadata";
import { leadershipProfiles, operatingPrinciples } from "@/lib/site-data";

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
        title="Senior-level guidance for companies that need sharper leadership, stronger brand clarity, and better execution."
        description="D2D Performance combines practical brand strategy, executive perspective, commercial thinking, and digital systems discipline so growth feels more intentional and less reactive."
        primaryCta={{ href: "/contact", label: "Schedule Discovery" }}
        secondaryCta={{ href: "/brand-development", label: "Build Your Brand" }}
      />
      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
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
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {operatingPrinciples.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                    {item.title}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-[2rem] bg-[var(--color-charcoal)] p-8 text-white">
            <h2 className="font-display text-4xl font-semibold tracking-[-0.03em]">
              What D2D Performance is not
            </h2>
            <p className="mt-5 text-base leading-8 text-white/75">
              It is not a generic marketing agency and it is not a deck-heavy
              consulting brand with no operational follow-through. Marketing can
              matter, but only when it is anchored to a stronger business
              strategy and a leadership team capable of executing it well.
            </p>
          </article>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {leadershipProfiles.map((profile, index) => {
            const Icon = index === 0 ? UserRound : MonitorCog;

            return (
              <article key={profile.name} className="editorial-frame p-8">
                <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
                  <Icon className="h-4 w-4" />
                  {profile.name}
                </p>
                <h3 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--color-taupe)]">
                  {profile.role}
                </h3>
                <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
                  {profile.focus}
                </p>
                <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
                  {profile.detail}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {profile.strengths.map((strength) => (
                    <span
                      key={strength}
                      className="inline-flex rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-ink)]"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <article className="rounded-[2rem] bg-[color:color-mix(in_oklab,var(--color-accent)_18%,white)] p-8">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
              <Sparkles className="h-4 w-4" />
              Better Together
            </p>
            <h3 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em] text-[var(--color-taupe)]">
              Strategy, commercial thinking, and execution quality in one operating conversation.
            </h3>
            <p className="mt-4 max-w-4xl text-base leading-8 text-[var(--color-muted)]">
              D2D Performance is strongest when brand thinking, leadership
              judgment, sales clarity, and build quality work together. That
              creates a more credible customer experience and a business that
              can actually carry the strategy it claims to have.
            </p>
            <div className="mt-6">
              <ButtonLink href="/contact">
                <span className="inline-flex items-center gap-2">
                  Start a Discovery Conversation
                  <ArrowRight className="h-4 w-4" />
                </span>
              </ButtonLink>
            </div>
          </article>

          <article className="editorial-frame p-8">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
              <Handshake className="h-4 w-4" />
              How We Show Up
            </p>
            <div className="mt-5 space-y-4">
              {[
                {
                  icon: BriefcaseBusiness,
                  title: "Senior-level perspective",
                  copy: "We help leaders make better decisions, not just collect more activity.",
                },
                {
                  icon: Sparkles,
                  title: "Brand thinking with practical edges",
                  copy: "Positioning, messaging, and customer experience are treated like business tools, not decoration.",
                },
                {
                  icon: MonitorCog,
                  title: "Execution that holds up",
                  copy: "Recommendations are shaped with systems, timelines, and real-world follow-through in mind.",
                },
              ].map(({ icon: Icon, title, copy }) => (
                <div
                  key={title}
                  className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5"
                >
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
                    <Icon className="h-4 w-4 text-[var(--color-accent)]" />
                    {title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                    {copy}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
