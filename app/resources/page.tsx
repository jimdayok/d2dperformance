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
        description="This section is structured to house articles, frameworks, and operating insights that reflect the D2D Performance perspective."
      />
      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {resources.map((resource) => (
            <article
              key={resource.title}
              className="rounded-[2rem] border border-[var(--color-border)] bg-white p-8"
            >
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
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
