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
          <article className="rounded-[2rem] border border-[var(--color-border)] bg-white p-8">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
              What D2D Performance believes
            </h2>
            <p className="mt-5 text-base leading-8 text-[var(--color-muted)]">
              Businesses do not scale on ambition alone. They scale when
              leadership alignment, strategic clarity, operating systems, and
              market credibility reinforce one another. That is where D2D
              Performance works.
            </p>
          </article>
          <article className="rounded-[2rem] bg-[var(--color-ink)] p-8 text-white">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">
              What D2D Performance is not
            </h2>
            <p className="mt-5 text-base leading-8 text-white/75">
              It is not positioned as a generic marketing agency. Marketing can
              matter, but only when it is anchored to a stronger business
              strategy and a leadership team capable of executing it well.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
