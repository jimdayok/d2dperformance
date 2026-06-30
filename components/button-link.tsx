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
      "inline-flex items-center justify-center border-b border-[var(--color-border-strong)] px-0 py-2 text-[0.82rem] font-medium uppercase tracking-[0.18em] text-[var(--button-primary-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
    secondary:
      "inline-flex items-center justify-center border border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] px-5 py-3 text-[0.78rem] font-medium uppercase tracking-[0.18em] text-[var(--button-secondary-text)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-panel)]",
    ghost:
      "inline-flex items-center justify-center px-0 py-2 text-[0.82rem] font-medium uppercase tracking-[0.18em] text-[var(--color-ink)] transition hover:text-[var(--color-accent)]",
    dark:
      "inline-flex items-center justify-center border border-[var(--color-charcoal)] bg-[var(--color-charcoal)] px-5 py-3 text-[0.78rem] font-medium uppercase tracking-[0.18em] text-white transition hover:bg-[var(--color-ink)]",
    light:
      "inline-flex items-center justify-center border border-white/24 bg-white/10 px-5 py-3 text-[0.78rem] font-medium uppercase tracking-[0.18em] text-white backdrop-blur transition hover:bg-white/18",
  } as const;

  return (
    <Link href={href} className={variants[variant]}>
      {children}
    </Link>
  );
}
