import Link from "next/link";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "dark" | "light";
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: ButtonLinkProps) {
  const variants = {
    primary:
      "inline-flex items-center justify-center rounded-full bg-[var(--button-primary-bg)] px-6 py-3 text-sm font-semibold text-[var(--button-primary-text)] shadow-[0_18px_40px_rgba(16,24,34,0.18)] transition hover:-translate-y-0.5 hover:brightness-105",
    secondary:
      "inline-flex items-center justify-center rounded-full border border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] px-6 py-3 text-sm font-semibold text-[var(--button-secondary-text)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-panel)]",
    ghost:
      "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-panel)]",
    dark:
      "inline-flex items-center justify-center rounded-full bg-[var(--color-charcoal)] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[var(--color-ink)]",
    light:
      "inline-flex items-center justify-center rounded-full border border-white/24 bg-white/14 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20",
  } as const;

  return (
    <Link href={href} className={variants[variant]}>
      {children}
    </Link>
  );
}
