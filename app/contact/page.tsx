import { PageIntro } from "@/components/page-intro";
import { companyEmail } from "@/lib/site-data";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Contact",
  description:
    "Start a discovery conversation with D2D Performance.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Start a discovery conversation."
        description="Reach out to discuss strategy, leadership, brand development, or the operational constraints limiting growth."
      />
      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.55fr_0.45fr]">
          <form className="rounded-[2rem] border border-[var(--color-border)] bg-white p-8 shadow-[0_24px_80px_rgba(31,41,51,0.06)]">
            <div className="grid gap-5">
              {[
                { label: "Name", type: "text", placeholder: "Your name" },
                { label: "Company", type: "text", placeholder: "Company name" },
                { label: "Email", type: "email", placeholder: "you@company.com" },
              ].map((field) => (
                <label key={field.label} className="grid gap-3">
                  <span className="text-sm font-medium text-[var(--color-ink)]">
                    {field.label}
                  </span>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    className="h-14 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 text-base text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
                  />
                </label>
              ))}
              <label className="grid gap-3">
                <span className="text-sm font-medium text-[var(--color-ink)]">
                  What are you trying to solve?
                </span>
                <textarea
                  rows={8}
                  placeholder="Share the business challenge, growth objective, or leadership issue you want to discuss."
                  className="min-h-40 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4 text-base text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)]"
                />
              </label>
              <a
                href={`mailto:${companyEmail}?subject=D2D%20Performance%20Discovery`}
                className="inline-flex w-fit items-center justify-center rounded-full bg-[var(--color-ink)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-ink-soft)]"
              >
                Schedule Discovery
              </a>
            </div>
          </form>

          <aside className="rounded-[2rem] bg-[var(--color-ink)] p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-sand)]">
              Contact
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">
              D2D Performance
            </h2>
            <p className="mt-5 text-base leading-8 text-white/75">
              Discovery conversations are designed for owners, founders, and
              leadership teams who want clearer strategy and more dependable
              execution.
            </p>
            <a
              href={`mailto:${companyEmail}`}
              className="mt-8 inline-block text-lg text-white underline underline-offset-4"
            >
              {companyEmail}
            </a>
          </aside>
        </div>
      </section>
    </>
  );
}
