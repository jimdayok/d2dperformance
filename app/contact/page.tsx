import { Mail, PhoneCall, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { PageIntro } from "@/components/page-intro";
import {
  companyEmail,
  contactAudience,
  leadershipProfiles,
} from "@/lib/site-data";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Contact",
  description: "Start a discovery conversation with D2D Performance.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title="Start a discovery conversation."
        description="Reach out to discuss leadership, growth, brand development, sales messaging, or the operational constraints limiting progress."
      />
      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <article className="editorial-frame p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
              Best fit conversations
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {contactAudience.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.4rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5 text-sm leading-7 text-[var(--color-muted)]"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-[2rem] bg-[var(--color-charcoal)] p-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-sand)]">
              Who you&apos;ll hear from
            </p>
            <div className="mt-5 space-y-5">
              {leadershipProfiles.map((profile) => (
                <div
                  key={profile.name}
                  className="rounded-[1.4rem] border border-white/12 bg-white/6 px-5 py-5"
                >
                  <p className="text-sm font-semibold text-white">{profile.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/58">
                    {profile.role}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/76">
                    {profile.focus}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.55fr_0.45fr]">
          <form className="editorial-frame p-8">
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
                className="inline-flex w-fit items-center justify-center rounded-full bg-[var(--button-primary-bg)] px-6 py-3 text-sm font-semibold text-[var(--button-primary-text)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(16,24,34,0.16)]"
              >
                Schedule Discovery
              </a>
            </div>
          </form>

          <aside className="rounded-[2rem] bg-[var(--color-charcoal)] p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-sand)]">
              Contact
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em]">
              D2D Performance
            </h2>
            <p className="mt-5 text-base leading-8 text-white/75">
              Discovery conversations are designed for owners, founders, and
              leadership teams who want clearer strategy and more dependable
              execution.
            </p>
            <div className="mt-8 space-y-4 text-sm text-white/78">
              <p className="inline-flex items-center gap-3">
                <Mail className="h-4 w-4 text-[var(--color-sand)]" />
                {companyEmail}
              </p>
              <p className="inline-flex items-center gap-3">
                <PhoneCall className="h-4 w-4 text-[var(--color-sand)]" />
                Discovery calls by appointment
              </p>
              <p className="inline-flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-[var(--color-sand)]" />
                Strategy-first, relationship-first, practical
              </p>
            </div>
            <div className="mt-8">
              <ButtonLink href={`mailto:${companyEmail}`} variant="light">
                <span className="inline-flex items-center gap-2">
                  Email D2D
                  <Mail className="h-4 w-4" />
                </span>
              </ButtonLink>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
