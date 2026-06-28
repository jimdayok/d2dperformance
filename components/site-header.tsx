"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ButtonLink } from "@/components/button-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { companyName, navigation, parentBrandName } from "@/lib/site-data";

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const navItems = navigation.filter(
    (item) =>
      [
        "/services",
        "/brand-development",
        "/executive-coaching",
        "/process",
        "/resources",
        "/about",
      ].includes(item.href),
  );

  return (
    <header className="sticky top-0 z-50 px-4 pt-4 lg:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-[1.35rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-card)_68%,transparent)] px-5 py-3 text-[var(--color-ink)] shadow-[0_10px_30px_rgba(16,24,34,0.08)] backdrop-blur-[18px] lg:px-6">
        <Link href="/" className="flex flex-col">
          <span className="text-lg font-semibold uppercase tracking-[0.28em]">
            {companyName}
          </span>
          <span className="mt-1 text-[11px] uppercase tracking-[0.34em] text-[var(--color-muted)]">
            {parentBrandName} Foundation
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  active
                    ? "bg-[var(--color-panel)] font-semibold text-[var(--color-ink)]"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-panel)] hover:text-[var(--color-ink)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <ButtonLink href="/contact" variant="primary">
            Schedule Discovery
          </ButtonLink>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-panel)] text-[var(--color-ink)]"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
          >
            <span className="sr-only">Toggle navigation</span>
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        className={`mx-auto mt-3 max-w-7xl overflow-hidden rounded-[1.25rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-card)_78%,transparent)] shadow-[0_14px_30px_rgba(16,24,34,0.08)] backdrop-blur-[18px] transition-[max-height,opacity] duration-300 lg:hidden ${
          isOpen ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl px-4 py-3 text-sm transition ${
                  active
                    ? "bg-[var(--color-panel)] font-semibold text-[var(--color-ink)]"
                    : "text-[var(--color-muted)] hover:bg-[var(--color-panel)] hover:text-[var(--color-ink)]"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-3">
            <ButtonLink href="/contact">Schedule Discovery</ButtonLink>
          </div>
        </nav>
      </div>
    </header>
  );
}
