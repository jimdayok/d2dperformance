import {
  BadgeDollarSign,
  BriefcaseBusiness,
  Compass,
  LayoutPanelTop,
  Megaphone,
  Route,
  Settings2,
  UsersRound,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { serviceList } from "@/lib/site-data";

const icons = [
  BriefcaseBusiness,
  BadgeDollarSign,
  UsersRound,
  Compass,
  Settings2,
  Route,
  Megaphone,
  LayoutPanelTop,
];

export function ServicesGridSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-18 lg:px-8">
      <SectionHeading
        eyebrow="Services"
        title="Built for companies that have outgrown generic advice."
        description="Our work spans strategy, leadership, brand, operations, and the commercial systems that make growth sustainable."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {serviceList.map((service, index) => {
          const Icon = icons[index];

          return (
            <div
              key={service}
              className="rounded-[1.6rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-card)_92%,transparent)] px-5 py-6 shadow-[0_14px_35px_rgba(16,24,34,0.05)] backdrop-blur-sm"
            >
              <Icon className="h-5 w-5 text-[var(--color-accent)]" />
              <p className="mt-4 text-base font-medium text-[var(--color-ink)]">
                {service}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
