import Link from "next/link";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
}: ButtonLinkProps) {
  const className =
    variant === "primary"
      ? "inline-flex items-center justify-center rounded-full bg-[var(--color-charcoal)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(35,45,56,0.24)] transition hover:-translate-y-0.5 hover:bg-[var(--color-accent)]"
      : "inline-flex items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-card)] px-6 py-3 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-panel)] hover:text-[var(--color-accent)]";

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
