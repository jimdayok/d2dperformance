"use client";

import { LayoutGrid, Mail, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ButtonLink } from "@/components/button-link";
import { ThemeToggle } from "@/components/theme-toggle";
import { companyName, navigation, parentBrandName } from "@/lib/site-data";

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[color:color-mix(in_oklab,var(--color-bg)_84%,transparent)] px-4 pt-4 backdrop-blur-xl lg:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-[1.75rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-accent)_82%,white)] px-6 py-4 text-white shadow-[0_18px_40px_rgba(88,72,77,0.16)] lg:px-8">
        <Link
          href="/"
          className="flex flex-col text-white"
        >
          <span className="font-display text-2xl font-semibold tracking-[0.04em]">
            {companyName}
          </span>
          <span className="mt-1 text-[11px] uppercase tracking-[0.34em] text-white/72">
            {parentBrandName} Foundation
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {navigation.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm transition ${
                  active
                    ? "font-semibold text-white"
                    : "text-white/76 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-white/10 text-white"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
          <ButtonLink href="/contact">Talk With D2D</ButtonLink>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/18 bg-white/10 text-white"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
          >
            <span className="sr-only">Toggle navigation</span>
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className={`mx-auto mt-3 max-w-7xl overflow-hidden rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] transition-[max-height,opacity] duration-300 lg:hidden ${
          isOpen ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
          {navigation.map((item) => {
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
          <div className="flex items-center gap-3 pt-3">
            <ButtonLink href="/contact">Talk With D2D</ButtonLink>
            <a
              href="mailto:performance@d2dmktg.com"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-ink)]"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
