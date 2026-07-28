import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { createMetadata } from "@/lib/metadata";
import { primaryEmail } from "@/lib/site-data";

export const metadata = createMetadata({
  title: "Privacy Policy",
  description: "How D2D Marketing collects, uses, and protects website information.",
  path: "/privacy-policy",
});

const sections = [
  {
    title: "Information we collect",
    body: "We may receive information you choose to provide through contact, brand discovery, executive coaching discovery, newsletter-interest, or project forms, including your name, company, email address, phone number, and the answers or messages you submit. Standard server and analytics logs may also record technical information such as browser type, IP address, referring pages, timestamps, and pages visited.",
  },
  {
    title: "How information is used",
    body: "Information is used to respond to inquiries, prepare requested strategy or discovery work, deliver and improve the website, maintain security, understand site use, and communicate about services you request. D2D Marketing does not sell or rent personally identifying information.",
  },
  {
    title: "Service providers",
    body: "The website may use hosting, database, email-delivery, analytics, scheduling, artificial-intelligence, and security providers to operate requested services. Those providers receive only the information needed for their role and are governed by their own privacy and security terms.",
  },
  {
    title: "Retention and choices",
    body: "Information is retained only as long as reasonably needed for the purpose collected, business records, security, or legal obligations. You may ask to review, correct, or delete information you submitted, subject to applicable recordkeeping requirements.",
  },
  {
    title: "External links",
    body: "This website links to third-party services and client resources. D2D Marketing is not responsible for the privacy practices or content of websites it does not control.",
  },
] as const;

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageIntro
        eyebrow="Legal"
        title="Privacy Policy"
        description="Your privacy and the safety of your information matter to DAY2DAY Marketing."
      />
      <section className="mx-auto max-w-4xl px-6 py-18 lg:px-8">
        <p className="text-sm text-[var(--color-muted)]">
          Effective July 27, 2026. This policy continues the privacy disclosures
          previously published for d2dmktg.com and reflects the current website
          services.
        </p>
        <div className="mt-10 grid gap-6">
          {sections.map((section) => (
            <article key={section.title} className="editorial-frame p-8">
              <h2 className="font-display text-3xl font-semibold text-[var(--color-ink)]">
                {section.title}
              </h2>
              <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
                {section.body}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-8 rounded-[1.5rem] bg-[var(--color-charcoal)] p-7 text-white">
          <h2 className="font-display text-3xl font-semibold">Privacy questions</h2>
          <p className="mt-3 text-sm leading-7 text-white/75">
            Contact{" "}
            <a className="underline underline-offset-4" href={`mailto:${primaryEmail}`}>
              {primaryEmail}
            </a>
            . You can also review the <Link className="underline underline-offset-4" href="/terms-of-use">Terms of Use</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
