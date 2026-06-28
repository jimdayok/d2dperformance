import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  eyebrow?: string;
};

export function FeatureCard({
  icon: Icon,
  title,
  description,
  eyebrow,
}: FeatureCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-[var(--color-border)] bg-[var(--color-card)] p-7 shadow-[0_20px_50px_rgba(15,23,42,0.05)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-accent-soft)]/10 text-[var(--color-accent)]">
        <Icon className="h-5 w-5" />
      </div>
      {eyebrow ? (
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
          {eyebrow}
        </p>
      ) : null}
      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
        {title}
      </h3>
      <p className="mt-4 text-base leading-7 text-[var(--color-muted)]">
        {description}
      </p>
    </article>
  );
}
