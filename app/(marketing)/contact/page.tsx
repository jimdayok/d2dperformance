import { Mail, PhoneCall, ShieldCheck } from "lucide-react";
import { ContactPlanner } from "@/components/project-brief/contact-planner";
import {
  companyName,
  primaryEmail,
  primaryPhone,
  primaryPhoneHref,
  serviceArea,
} from "@/lib/site-data";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Contact",
  description: "Discuss revenue improvement, dashboards, business systems, website development, or app development with D2D Performance.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <section className="performance-contact-page mx-auto max-w-7xl px-6 pb-18 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">Contact D2D Performance</p>
          <h1 className="mt-4 font-display text-4xl leading-tight tracking-[-0.03em] md:text-5xl">Let&apos;s improve how your business works.</h1>
          <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">Tell us about your revenue goals, reporting needs, or the systems slowing your team down.</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-[0.7fr_0.3fr]">
          <div className="platform-contact performance-contact"><ContactPlanner platform="performance" /></div>

          <aside className="rounded-[2rem] bg-[var(--color-charcoal)] p-8 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--color-sand)]">
              Contact
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.03em]">
              {companyName}
            </h2>
            <p className="mt-5 text-base leading-8 text-white/75">
              Discuss revenue improvement, dashboards, business information
              systems, and the operational challenges you want to solve.
            </p>
            <div className="mt-8 space-y-4 text-sm text-white/78">
              <a
                href={`mailto:${primaryEmail}`}
                className="flex items-center gap-3 transition hover:text-white"
              >
                <Mail className="h-4 w-4 text-[var(--color-sand)]" />
                {primaryEmail}
              </a>
              <a
                href={`tel:${primaryPhoneHref}`}
                className="flex items-center gap-3 transition hover:text-white"
              >
                <PhoneCall className="h-4 w-4 text-[var(--color-sand)]" />
                {primaryPhone}
              </a>
              <p className="inline-flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-[var(--color-sand)]" />
                {serviceArea}
              </p>
            </div>

          </aside>
        </div>
      </section>
    </>
  );
}
