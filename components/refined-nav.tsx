"use client";

import { Menu, MoveRight, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { companyName, navigation, parentBrandName } from "@/lib/site-data";

const navItems = navigation.filter((item) =>
  [
    "/services",
    "/brand-development",
    "/executive-coaching",
    "/growth-strategy",
    "/about",
    "/resources",
  ].includes(item.href),
);

export function RefinedNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 24);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-5 pt-4 lg:px-8">
      <div
        className={`mx-auto max-w-[88rem] transition-all duration-500 ${
          isScrolled ? "nav-hairline" : ""
        }`}
      >
        <div
          className={`flex items-center justify-between gap-5 transition-all duration-500 ${
            isScrolled
              ? "rounded-[1.2rem] border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-card)_78%,transparent)] px-5 py-3 shadow-[0_18px_50px_rgba(17,15,12,0.08)] backdrop-blur-[18px]"
              : "px-0 py-2"
          }`}
        >
          <Link href="/" className="group min-w-0">
            <span className="block text-[0.7rem] font-medium uppercase tracking-[0.38em] text-[var(--color-muted)] transition group-hover:text-[var(--color-ink)]">
              {parentBrandName}
            </span>
            <span className="mt-1 block font-display text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
              {companyName}
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative text-[0.82rem] uppercase tracking-[0.18em] transition ${
                    active
                      ? "text-[var(--color-ink)]"
                      : "text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute -bottom-2 left-0 h-px bg-[var(--color-accent)] transition-all duration-300 ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <Link
              href="/#brand-discovery"
              className="inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-1 text-[0.82rem] uppercase tracking-[0.18em] text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Start Brand Discovery
              <MoveRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            className={`inline-flex h-11 w-11 items-center justify-center border text-[var(--color-ink)] transition lg:hidden ${
              isScrolled
                ? "rounded-[1rem] border-[var(--color-border)] bg-[var(--color-card)]"
                : "rounded-[1rem] border-transparent bg-[color:color-mix(in_oklab,var(--color-card)_44%,transparent)]"
            }`}
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        className={`mx-auto mt-4 max-w-[88rem] overflow-hidden transition-all duration-400 lg:hidden ${
          isOpen ? "max-h-[36rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="paper-panel rounded-[1.35rem] px-6 py-6 backdrop-blur-xl">
          <p className="eyebrow-label">Navigation</p>
          <nav className="mt-6 flex flex-col gap-4">
            {navItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`border-b pb-4 text-lg tracking-[-0.03em] transition ${
                    active
                      ? "border-[var(--color-accent)] text-[var(--color-ink)]"
                      : "border-[var(--color-border-soft)] text-[var(--color-muted)] hover:text-[var(--color-ink)]"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/#brand-discovery"
            className="mt-8 inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-1 text-sm uppercase tracking-[0.18em] text-[var(--color-ink)]"
            onClick={() => setIsOpen(false)}
          >
            Start Brand Discovery
            <MoveRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
