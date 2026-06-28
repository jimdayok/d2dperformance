import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
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
    <footer className="footer-wave mt-24 bg-[color:color-mix(in_oklab,var(--color-accent)_88%,black)] text-white">
      <div className="relative mx-auto max-w-7xl px-6 pb-14 pt-24 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.9fr]">
          <div className="max-w-md space-y-5">
            <p className="font-display text-4xl font-semibold tracking-[0.04em]">
              {companyName}
            </p>
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">
              {parentBrandName} foundation
            </p>
            <p className="text-sm leading-7 text-white/74">
              {tagline} Built to support the real day-to-day of the business with
              strategy, brand clarity, and practical execution.
            </p>
            <div className="space-y-3 text-sm text-white/74">
              <p className="inline-flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[var(--color-sand)]" />
                Dallas - Fort Worth
              </p>
              <p className="inline-flex items-center gap-3">
                <Phone className="h-4 w-4 text-[var(--color-sand)]" />
                Discovery calls by appointment
              </p>
              <a
                href={`mailto:${companyEmail}`}
                className="inline-flex items-center gap-3 transition hover:text-white"
              >
                <Mail className="h-4 w-4 text-[var(--color-sand)]" />
                {companyEmail}
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">
              Main Menu
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/75">
              {navigation.slice(0, 5).map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">
              More
            </p>
            <div className="mt-4 flex flex-col gap-3 text-sm text-white/75">
              {navigation.slice(5).map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-white">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/55">
              Why D2D
            </p>
            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/6 p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-[var(--color-sand)]" />
                Better together
              </p>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Senior-level strategy, down-to-earth guidance, and brand systems
                designed for real-world use.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
