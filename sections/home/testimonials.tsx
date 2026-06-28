import { Quote } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { testimonials } from "@/lib/site-data";

export function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <SectionHeading
        eyebrow="Testimonials"
        title="Reserved for real client proof."
        description="Placeholder language is used intentionally until verified testimonials are available."
      />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {testimonials.map((testimonial) => (
          <blockquote
            key={testimonial.name}
            className="editorial-frame p-8"
          >
            <Quote className="h-7 w-7 text-[var(--color-accent)]" />
            <p className="mt-5 text-lg leading-8 text-[var(--color-ink)]">
              “{testimonial.quote}”
            </p>
            <footer className="mt-6 text-sm font-medium text-[var(--color-muted)]">
              {testimonial.name}
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}
