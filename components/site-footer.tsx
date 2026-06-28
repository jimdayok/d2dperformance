import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { ButtonLink } from "@/components/button-link";
import {
  companyEmail,
  companyName,
  navigation,
  parentBrandName,
  tagline,
} from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-surface)_92%,transparent)]">
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="grid gap-10 rounded-[2rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-card)_94%,transparent)] p-8 shadow-[0_18px_50px_rgba(16,24,34,0.05)] backdrop-blur-sm lg:grid-cols-[1.25fr_0.85fr_0.9fr] lg:p-10">
          <div className="max-w-md space-y-5">
            <p className="font-display text-4xl font-semibold tracking-[0.02em] text-[var(--color-taupe)]">
              {companyName}
            </p>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--color-accent)]">
              {parentBrandName} foundation
            </p>
            <p className="text-sm leading-7 text-[var(--color-muted)]">
              {tagline} Executive consulting and brand clarity for companies
              that need better leadership, stronger execution, and more
              credible growth systems.
            </p>
            <div className="space-y-3 text-sm text-[var(--color-muted)]">
              <p className="inline-flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[var(--color-accent)]" />
                Dallas - Fort Worth
              </p>
              <p className="inline-flex items-center gap-3">
                <Phone className="h-4 w-4 text-[var(--color-accent)]" />
                Discovery calls by appointment
              </p>
              <a
                href={`mailto:${companyEmail}`}
                className="inline-flex items-center gap-3 transition hover:text-[var(--color-ink)]"
              >
                <Mail className="h-4 w-4 text-[var(--color-accent)]" />
                {companyEmail}
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
              Links
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--color-muted)]">
              {navigation
                .filter((item) =>
                  [
                    "/services",
                    "/brand-development",
                    "/executive-coaching",
                    "/process",
                    "/resources",
                    "/about",
                  ].includes(item.href),
                )
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="transition hover:text-[var(--color-ink)]"
                  >
                    {item.label}
                  </Link>
                ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
              Contact
            </p>
            <div className="mt-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <p className="text-sm leading-7 text-[var(--color-muted)]">
                Schedule a discovery conversation to talk through leadership,
                brand, growth, or operational friction inside the business.
              </p>
              <div className="mt-5">
                <ButtonLink href="/contact" variant="secondary">
                  <span className="inline-flex items-center gap-2">
                    Contact D2D
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
