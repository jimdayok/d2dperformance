import {
  AlertCircle,
  Compass,
  Network,
  ShieldAlert,
  Target,
  Workflow,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { stallReasons } from "@/lib/site-data";

export function WhyStallSection() {
  const icons = [Network, Compass, Target, Workflow, ShieldAlert, AlertCircle];

  return (
    <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionHeading
          eyebrow="Why Companies Stall"
          title="Most growth problems are not marketing problems."
          description="Companies stall when leadership, systems, brand, and execution stop reinforcing one another."
        />
        <div className="grid gap-4">
          {stallReasons.map((reason, index) => {
            const Icon = icons[index];

            return (
              <div
                key={reason}
                className="flex gap-4 rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-5 shadow-[0_12px_32px_rgba(57,43,49,0.04)]"
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
