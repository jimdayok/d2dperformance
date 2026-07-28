import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { createMetadata } from "@/lib/metadata";
import { legalBusinessName, primaryEmail } from "@/lib/site-data";

export const metadata = createMetadata({
  title: "Terms of Use",
  description: "Terms governing use of the D2D Marketing website.",
  path: "/terms-of-use",
});

const terms = [
  {
    title: "Agreement to these terms",
    body: `These terms govern access to d2dmktg.com and related website services operated by ${legalBusinessName}, doing business as DAY2DAY Marketing. By using the website, you agree to these terms. If you do not agree, do not use the website.`,
  },
  {
    title: "Website information",
    body: "Website content is provided for general business and marketing information. It is not legal, tax, accounting, investment, medical, or other regulated professional advice, and it does not create a client relationship or guarantee a particular business result.",
  },
  {
    title: "Intellectual property",
    body: "Unless otherwise identified, the website design, copy, graphics, downloads, and other original materials belong to DAY2DAY Marketing or are used with permission. You may view and print reasonable portions for personal or internal business evaluation, but may not republish, sell, or misrepresent the materials.",
  },
  {
    title: "Acceptable use",
    body: "Do not misuse the website, attempt unauthorized access, interfere with its operation, submit unlawful or harmful material, impersonate another person, or use automated systems in a way that burdens or compromises the service.",
  },
  {
    title: "Third-party services",
    body: "Links, embeds, scheduling tools, client portals, and other third-party services are provided for convenience. Their separate terms and privacy policies apply, and DAY2DAY Marketing is not responsible for services it does not control.",
  },
  {
    title: "Availability and changes",
    body: "The website may be changed, suspended, or updated without notice. These terms may also be revised by posting an updated effective date. Continued use after an update means you accept the revised terms.",
  },
  {
    title: "Texas law",
    body: "These terms are governed by the laws of the State of Texas, without regard to conflict-of-law rules, except where applicable law requires otherwise.",
  },
] as const;

export default function TermsOfUsePage() {
  return (
    <>
      <PageIntro
        eyebrow="Legal"
        title="Terms of Use"
        description="Terms for using the DAY2DAY Marketing website and its public resources."
      />
      <section className="mx-auto max-w-4xl px-6 py-18 lg:px-8">
        <p className="text-sm text-[var(--color-muted)]">
          Effective July 27, 2026. These terms replace the version last updated
          March 16, 2022 for the migrated website.
        </p>
        <div className="mt-10 grid gap-6">
          {terms.map((term) => (
            <article key={term.title} className="editorial-frame p-8">
              <h2 className="font-display text-3xl font-semibold text-[var(--color-ink)]">
                {term.title}
              </h2>
              <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
                {term.body}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-sm leading-7 text-[var(--color-muted)]">
          Questions may be sent to{" "}
          <a className="underline underline-offset-4" href={`mailto:${primaryEmail}`}>
            {primaryEmail}
          </a>
          . See the <Link className="underline underline-offset-4" href="/privacy-policy">Privacy Policy</Link> for information-handling details.
        </p>
      </section>
    </>
  );
}
