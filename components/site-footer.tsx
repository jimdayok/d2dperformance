import Link from "next/link";
import { Code2, Megaphone } from "lucide-react";
import {
  companyName,
  navigation,
  parentBrandName,
  primaryEmail,
  primaryPhone,
  primaryPhoneHref,
  serviceArea,
  tagline,
} from "@/lib/site-data";

const footerLinks = navigation.filter((item) =>
  [
    "/services",
    "/executive-coaching",
    "/brand-development",
    "/growth-strategy",
    "/about",
    "/contact",
  ].includes(item.href),
);

const websiteManagementUrl = "https://portal.d2dperformance.com/portal/login";
const brandVaultUrl = "https://brandvault.d2dperformance.com";
const marketingUrl = "https://d2dmktg.com";
const digitalUrl = "/digital";

export function SiteFooter() {
  return (
    <footer className="performance-footer mt-28 border-t border-[var(--color-border)]">
      <div className="performance-footer-journey">
        <p>The connected D2D system</p>
        <div>
          <a href={marketingUrl}>
            <Megaphone aria-hidden="true" />
            <strong>D2D Marketing</strong>
            <small>Strategy + brand + growth · Main practice</small>
          </a>
          <a href={digitalUrl}>
            <Code2 aria-hidden="true" />
            <strong>D2D Digital</strong>
            <small>Build + integrate</small>
          </a>
        </div>
      </div>
      <div className="mx-auto max-w-[88rem] px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.7fr_0.8fr] lg:gap-14">
          <div className="max-w-xl">
            <p className="eyebrow-label">{parentBrandName}</p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.04em] text-[var(--color-ink)] md:text-5xl">
              {companyName}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-8 text-[var(--color-muted)]">
              {tagline} Brand, marketing, leadership, and growth support for
              established companies that need clearer direction and more
              repeatable execution.
            </p>
            <div className="mt-8 space-y-2 text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
              <p>{serviceArea}</p>
              <p>Advisory work by appointment</p>
              <a
                href={`mailto:${primaryEmail}`}
                className="block w-fit normal-case tracking-normal text-[var(--color-ink)] transition hover:text-[var(--color-accent)]"
              >
                {primaryEmail}
              </a>
              <a
                href={`tel:${primaryPhoneHref}`}
                className="block w-fit normal-case tracking-normal text-[var(--color-ink)] transition hover:text-[var(--color-accent)]"
              >
                {primaryPhone}
              </a>
              <Link
                href="/contact"
                className="inline-block border-b border-[var(--color-border-strong)] pb-1 text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                Contact D2D
              </Link>
            </div>
          </div>

          <div>
            <p className="eyebrow-label">Navigate</p>
            <nav className="mt-5 flex flex-col gap-4">
              {footerLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="w-fit border-b border-transparent pb-1 text-base tracking-[-0.02em] text-[var(--color-muted)] transition hover:border-[var(--color-border)] hover:text-[var(--color-ink)]"
                >
                  {item.label}
                </Link>
              ))}
              <a
                href={brandVaultUrl}
                className="w-fit border-b border-transparent pb-1 text-base tracking-[-0.02em] text-[var(--color-muted)] transition hover:border-[var(--color-border)] hover:text-[var(--color-ink)]"
              >
                Brand Vault
              </a>
              <a
                href={websiteManagementUrl}
                className="w-fit border-b border-transparent pb-1 text-base tracking-[-0.02em] text-[var(--color-muted)] transition hover:border-[var(--color-border)] hover:text-[var(--color-ink)]"
              >
                Website Management
              </a>
            </nav>
          </div>

          <div className="paper-panel rounded-[1.4rem] px-6 py-6">
            <p className="eyebrow-label">Start Here</p>
            <p className="mt-4 text-2xl font-display font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
              If the business feels heavier than it should, start there.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
              The first move is the full brand discovery. It gives us the raw
              business context before strategy, design, messaging, or growth
              advice gets layered on top.
            </p>
            <Link
              href="/#brand-discovery"
              className="mt-6 inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-1 text-sm uppercase tracking-[0.18em] text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Start Brand Discovery
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--color-border)] px-6 py-6 text-center text-xs text-[var(--color-muted)]">
        © {new Date().getFullYear()} DAY2DAY Marketing.{" "}
        <Link href="/privacy-policy" className="underline underline-offset-4">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="/terms-of-use" className="underline underline-offset-4">
          Terms
        </Link>
      </div>
    </footer>
  );
}
