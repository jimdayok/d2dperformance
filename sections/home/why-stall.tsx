import {
  Compass,
  Network,
  ShieldAlert,
  Target,
  Workflow,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

export function WhyStallSection() {
  const reasons = [
    "Leadership priorities are unclear.",
    "Marketing looks active, but the strategy underneath is weak.",
    "Sales performance is inconsistent because the process is not owned.",
    "Operations become reactive as complexity increases.",
    "The brand is not differentiated enough to command confidence.",
  ];
  const icons = [Network, Compass, Target, Workflow, ShieldAlert];

  return (
    <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionHeading
          eyebrow="Why Companies Stall"
          title="Most growth problems are not marketing problems."
          description="Companies stall when leadership, systems, brand, and execution stop reinforcing one another."
        />
        <div className="grid gap-4">
          {reasons.map((reason, index) => {
            const Icon = icons[index];

            return (
              <div
                key={reason}
                className="flex gap-4 rounded-[1.75rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-card)_94%,transparent)] px-5 py-5 shadow-[0_16px_40px_rgba(16,24,34,0.05)]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-[color:color-mix(in_oklab,var(--color-accent)_18%,white)] text-[var(--color-accent)]">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-base leading-7 text-[var(--color-muted)]">{reason}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
