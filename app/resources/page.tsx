import { PageIntro } from "@/components/page-intro";
import { createMetadata } from "@/lib/metadata";
import { resources } from "@/lib/site-data";

export const metadata = createMetadata({
  title: "Resources",
  description:
    "Read executive perspectives and future resource content from D2D Performance.",
  path: "/resources",
});

export default function ResourcesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Resources"
        title="Practical thinking for leaders building companies that scale."
        description="This section is built to house articles, frameworks, and operating insights across brand, leadership, growth, and customer experience."
        primaryCta={{ href: "/contact", label: "Talk With D2D" }}
      />
      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
        <div className="mb-8 rounded-[2rem] bg-[color:color-mix(in_oklab,var(--color-accent)_15%,white)] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
            Resource Direction
          </p>
          <p className="mt-4 max-w-4xl text-base leading-8 text-[var(--color-muted)]">
            Expect short strategic perspectives, brand frameworks, commercial
            planning guidance, and executive operating insights designed to be
            useful in the real day-to-day of growing a business.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {resources.map((resource) => (
            <article
              key={resource.title}
              className="rounded-[2rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-card)_94%,transparent)] p-8 shadow-[0_16px_40px_rgba(16,24,34,0.05)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                {resource.type}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                {resource.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
                {resource.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
