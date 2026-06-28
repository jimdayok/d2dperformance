import { ButtonLink } from "@/components/button-link";
import { SectionHeading } from "@/components/section-heading";

export function BrandCtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <div className="rounded-[2rem] border border-[var(--color-border)] bg-white px-8 py-14 shadow-[0_20px_60px_rgba(31,41,51,0.05)] md:px-12">
        <SectionHeading
          eyebrow="Brand Development"
          title="Every engagement starts with understanding the business."
          description="Our guided discovery process surfaces the strategy, positioning, voice, and growth realities that shape a credible brand. It is not a mood board. It is the foundation for a stronger company narrative."
        />
        <div className="mt-8">
          <ButtonLink href="/brand-development#brand-discovery">
            Start Brand Discovery
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
