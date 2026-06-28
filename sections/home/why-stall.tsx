import { SectionHeading } from "@/components/section-heading";
import { stallReasons } from "@/lib/site-data";

export function WhyStallSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionHeading
          eyebrow="Why Companies Stall"
          title="Most growth problems are not marketing problems."
          description="Companies stall when leadership, systems, brand, and execution stop reinforcing one another."
        />
        <div className="grid gap-4">
          {stallReasons.map((reason, index) => (
            <div
              key={reason}
              className="flex gap-4 rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[var(--color-accent)]">
                {index + 1}
              </span>
              <p className="text-base leading-7 text-[var(--color-muted)]">{reason}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
