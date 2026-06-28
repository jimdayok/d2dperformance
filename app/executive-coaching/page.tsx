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
              className="rounded-[2rem] border border-[var(--color-border)] bg-white p-8"
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
