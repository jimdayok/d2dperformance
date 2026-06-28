import { PageIntro } from "@/components/page-intro";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Executive Coaching",
  description:
    "Advisory and coaching support for founders and leadership teams building stronger operating discipline.",
  path: "/executive-coaching",
});

export default function ExecutiveCoachingPage() {
  return (
    <>
      <PageIntro
        eyebrow="Executive Coaching"
        title="Leadership support for owners carrying meaningful complexity."
        description="D2D Performance helps executive leaders think more clearly, run better operating rhythms, and create stronger accountability without adding noise or buzzwords."
        primaryCta={{ href: "/contact", label: "Schedule Discovery" }}
      />
      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] bg-[var(--color-charcoal)] p-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-sand)]">
              Coaching Approach
            </p>
            <p className="mt-4 text-base leading-8 text-white/76">
              This work is less about motivation and more about operating
              clarity: better leadership conversations, cleaner accountability,
              stronger decisions, and fewer stalled priorities.
            </p>
          </article>
          <article className="editorial-frame p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
              Typical outcomes
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                "Clearer roles and ownership",
                "More effective leadership meetings",
                "Better follow-through across the team",
                "Less decision fatigue on the founder",
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
          {[
            {
              title: "What It Solves",
              copy: "Decision fatigue, unclear leadership roles, inconsistent accountability, and meetings that never fully move the business forward.",
            },
            {
              title: "What You Get",
              copy: "A stronger leadership cadence, practical coaching conversations, sharper priorities, and clearer follow-through across the team.",
            },
            {
              title: "Who It Fits",
              copy: "Founders, presidents, and executive teams leading companies through growth, succession, or operational strain.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[2rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-card)_94%,transparent)] p-8"
            >
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                {item.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
                {item.copy}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
