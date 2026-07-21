import { EditorialHero } from "@/components/editorial-hero";
import { EditorialList } from "@/components/editorial-list";
import { ExecutiveCoachingDiscoveryForm } from "@/components/executive-coaching-discovery-form";
import { NarrativeSection } from "@/components/narrative-section";
import { OperatingLensDiagram } from "@/components/operating-lens-diagram";
import { PremiumCTA } from "@/components/premium-cta";
import { ScrollRevealText } from "@/components/scroll-reveal-text";
import { SplitStatement } from "@/components/split-statement";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Executive Coaching",
  description:
    "Executive coaching for founders and leadership teams who need cleaner ownership, steadier operating rhythms, and a business that feels lighter to run.",
  path: "/executive-coaching",
});

export default function ExecutiveCoachingPage() {
  return (
    <>
      <EditorialHero />

      <SplitStatement
        eyebrow="The Real Problem"
        title="Most companies do not have a strategy problem. They have an execution problem disguised as a communication problem."
        body="The symptoms show up as stalled priorities, vague ownership, leadership meetings that circle the same issues, and founders who still carry every important decision."
      />

      <NarrativeSection />

      <EditorialList />

      <OperatingLensDiagram />

      <section className="px-6 py-22 lg:px-8 lg:py-30">
        <div className="mx-auto grid max-w-[88rem] gap-12 lg:grid-cols-[0.46fr_0.54fr]">
          <div>
            <p className="eyebrow-label">How Coaching Works</p>
            <h2 className="mt-5 max-w-lg font-display text-[clamp(2.5rem,5.4vw,5.2rem)] leading-[0.98] tracking-[-0.06em] text-[var(--color-ink)]">
              Less motivation. More operating clarity.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-8 text-[var(--color-muted)]">
              This is not performance theater. The work is practical, direct,
              and built around the conversations, decisions, meetings, and
              ownership structures already shaping the business.
            </p>
          </div>

          <div className="paper-panel rounded-[1.6rem] px-6 py-8 md:px-8 md:py-10">
            <div className="space-y-6">
              {[
                {
                  number: "01",
                  title: "Name the friction",
                  body: "We identify where the business is getting heavier than it should be.",
                },
                {
                  number: "02",
                  title: "Clarify ownership",
                  body: "We tighten expectations, decision rights, and what each leader actually owns.",
                },
                {
                  number: "03",
                  title: "Tighten the cadence",
                  body: "We rebuild the weekly rhythm so meetings move decisions instead of summarizing work.",
                },
                {
                  number: "04",
                  title: "Follow through weekly",
                  body: "We stay close enough to the real operating week for behavior to change, not just language.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="grid gap-4 border-t border-[var(--color-border)] pt-5 md:grid-cols-[4.5rem_minmax(0,1fr)]"
                >
                  <span className="font-display text-4xl tracking-[-0.06em] text-[color:color-mix(in_oklab,var(--color-accent)_52%,white)]">
                    {item.number}
                  </span>
                  <div>
                    <h3 className="text-[1.45rem] tracking-[-0.03em] text-[var(--color-ink)]">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-base leading-8 text-[var(--color-muted)]">
                      {item.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-22 lg:px-8 lg:py-30">
        <div className="mx-auto max-w-[88rem]">
          <p className="eyebrow-label">Outcomes</p>
          <div className="mt-8 space-y-5 border-t border-[var(--color-border)] pt-8">
            <ScrollRevealText lines={["Cleaner decisions."]} />
            <ScrollRevealText lines={["Stronger ownership."]} />
            <ScrollRevealText lines={["Meetings that move work."]} />
            <ScrollRevealText
              lines={["A founder carrying less of", "the business alone."]}
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-22 lg:px-8 lg:py-28">
        <div className="section-rule mx-auto mb-12 max-w-[88rem]" />
        <div className="mx-auto grid max-w-[88rem] gap-10 lg:grid-cols-[0.48fr_0.52fr]">
          <div>
            <p className="eyebrow-label">Who It Fits</p>
            <h2 className="mt-5 max-w-lg font-display text-[clamp(2.5rem,5.2vw,4.8rem)] leading-[0.98] tracking-[-0.06em] text-[var(--color-ink)]">
              This is not for every business.
            </h2>
            <p className="mt-5 max-w-md text-lg leading-8 text-[var(--color-muted)]">
              It fits founders, presidents, and executive teams who have
              outgrown informal leadership habits and need a cleaner way to run
              the business.
            </p>
          </div>

          <div className="space-y-5">
            {[
              "Growth is exposing leadership strain.",
              "Succession or expansion is creating complexity.",
              "The team is capable but misaligned.",
              "The founder is still the final stop for too much.",
            ].map((item) => (
              <div
                key={item}
                className="border-t border-[var(--color-border)] pt-5 text-[1.35rem] leading-[1.35] tracking-[-0.03em] text-[var(--color-ink)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-22 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-[88rem]">
          <div className="grid gap-10 lg:grid-cols-[0.42fr_0.58fr]">
            <div>
              <p className="eyebrow-label">Discovery Questionnaire</p>
              <h2 className="mt-5 max-w-lg font-display text-[clamp(2.4rem,5vw,4.8rem)] leading-[0.98] tracking-[-0.06em] text-[var(--color-ink)]">
                A lighter intake that still gets to the important stuff.
              </h2>
              <p className="mt-5 max-w-md text-lg leading-8 text-[var(--color-muted)]">
                We kept the strongest questions from your original discovery
                document, cleaned them up, and turned them into a more engaging
                way to begin the conversation.
              </p>
            </div>
            <div className="lg:pt-6">
              <ExecutiveCoachingDiscoveryForm />
            </div>
          </div>
        </div>
      </section>

      <PremiumCTA />
    </>
  );
}
