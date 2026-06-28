import { SectionHeading } from "@/components/section-heading";
import { serviceList } from "@/lib/site-data";

export function ServicesGridSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <SectionHeading
        eyebrow="Services"
        title="Built for companies that have outgrown generic advice."
        description="Our work spans strategy, leadership, brand, operations, and the commercial systems that make growth sustainable."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {serviceList.map((service) => (
          <div
            key={service}
            className="rounded-[1.5rem] border border-[var(--color-border)] bg-white px-5 py-6 text-base font-medium text-[var(--color-ink)]"
          >
            {service}
          </div>
        ))}
      </div>
    </section>
  );
}
