import Link from "next/link";
import {
  companyEmail,
  companyName,
  navigation,
  parentBrandName,
  tagline,
} from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-[var(--color-ink)] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div className="max-w-md space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-sand)]">
            {companyName}
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.03em]">
            Build a better business. Not just better marketing.
          </h2>
          <p className="text-sm leading-7 text-white/70">
            {tagline} Built on the {parentBrandName} brand foundation.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/50">
            Navigate
          </p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-white/75">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/50">
            Contact
          </p>
          <div className="mt-4 space-y-3 text-sm text-white/75">
            <a href={`mailto:${companyEmail}`} className="block transition hover:text-white">
              {companyEmail}
            </a>
            <p>Discovery conversations for owners, founders, and executive teams.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
