import { Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/button-link";
import { SectionHeading } from "@/components/section-heading";

export function BrandCtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <div className="editorial-frame overflow-hidden px-8 py-14 md:px-12">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-[var(--color-charcoal)] p-8 text-white">
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-[var(--color-sand)]">
              <Sparkles className="h-4 w-4" />
              Brand Development
            </p>
            <p className="mt-4 text-lg leading-8 text-white/76">
              Our guided discovery process surfaces the strategy, positioning,
              voice, and growth realities that shape a credible brand.
            </p>
          </div>
          <div>
            <SectionHeading
              eyebrow="Build Brand Awareness Before You Market It"
              title="Every engagement starts with understanding the business."
              description="It is not a mood board. It is the foundation for a stronger company narrative, a cleaner website strategy, and marketing that actually has direction."
            />
            <div className="mt-8">
              <ButtonLink href="/brand-development#brand-discovery">
                Start Brand Discovery
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
