"use client";

import {
  ChartNoAxesCombined,
  ChevronDown,
  Code2,
  Megaphone,
  Menu,
  MoveRight,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { companyName, parentBrandName } from "@/lib/site-data";

const websiteManagementUrl = "https://webadmin.d2dmktg.com";
const brandVaultUrl = "https://brandvault.d2dmktg.com";
const marketingUrl = "https://d2dmktg.com";
const digitalUrl = "https://d2d-digital.vercel.app";

const serviceItems = [
  {
    href: "/#performance-framework",
    label: "All Services",
    description: "See the connected D2D Performance framework.",
  },
  {
    href: "/#performance-framework",
    label: "Revenue Improvement",
    description: "Find and improve the commercial levers that matter.",
  },
  {
    href: "/#analysis",
    label: "Dashboards & Analysis",
    description: "Turn operating data into decision-ready information.",
  },
  {
    href: "/#analysis",
    label: "Information Systems",
    description: "Connect tools, definitions, workflows, and ownership.",
  },
] as const;

const primaryItems = [
  { href: "/process", label: "How We Work" },
  { href: "/about", label: "About" },
] as const;

const clientItems = [
  {
    href: brandVaultUrl,
    label: "Brand Vault",
    description: "Find approved logos, files, and brand guidelines.",
  },
  {
    href: websiteManagementUrl,
    label: "Website Management",
    description: "Review and update your D2D-managed website.",
  },
] as const;

type DesktopMenu = "services" | "client" | null;

export function RefinedNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileCompact, setIsMobileCompact] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState<DesktopMenu>(null);

  const servicesActive = serviceItems.some((item) => item.href === pathname);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 24);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDesktopMenu(null);
        setIsOpen(false);
      }
    }

    function handleOutsideClick(event: PointerEvent) {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest("[data-desktop-menu]")
      ) {
        setDesktopMenu(null);
      }
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("pointerdown", handleOutsideClick);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 680px)");
    let compactTimer: number | undefined;

    function clearCompactTimer() {
      if (compactTimer !== undefined) {
        window.clearTimeout(compactTimer);
        compactTimer = undefined;
      }
    }

    function updateMobileHeader() {
      if (!mobile.matches || window.scrollY < 96 || isOpen) {
        clearCompactTimer();
        setIsMobileCompact(false);
        return;
      }

      if (compactTimer === undefined) {
        compactTimer = window.setTimeout(() => {
          compactTimer = undefined;

          if (mobile.matches && window.scrollY >= 96 && !isOpen) {
            setIsMobileCompact(true);
          }
        }, 1800);
      }
    }

    const initialFrame = window.requestAnimationFrame(updateMobileHeader);
    window.addEventListener("scroll", updateMobileHeader, { passive: true });
    mobile.addEventListener("change", updateMobileHeader);

    return () => {
      clearCompactTimer();
      window.cancelAnimationFrame(initialFrame);
      window.removeEventListener("scroll", updateMobileHeader);
      mobile.removeEventListener("change", updateMobileHeader);
    };
  }, [isOpen]);

  function closeMobileMenu() {
    setIsOpen(false);
  }

  function toggleMobileMenu() {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);

    if (nextOpen) {
      setIsMobileCompact(false);
    }
  }

  return (
    <header
      className={`performance-site-header${
        isMobileCompact && !isOpen ? " is-mobile-compact" : ""
      }`}
    >
      <nav className="performance-ecosystem-nav" aria-label="D2D companies">
        <span className="performance-ecosystem-label">The D2D system</span>
        <div>
          <a href={marketingUrl}>
            <Megaphone aria-hidden="true" />
            <strong>D2D Marketing</strong>
            <small>Strategy + brand + growth</small>
          </a>
          <a href={digitalUrl}>
            <Code2 aria-hidden="true" />
            <strong>D2D Digital</strong>
            <small>Build + integrate</small>
          </a>
          <Link className="is-current" href="/#top" aria-current="page">
            <ChartNoAxesCombined aria-hidden="true" />
            <strong>D2D Performance</strong>
            <small>Lead + improve</small>
          </Link>
        </div>
      </nav>
      <div
        className={`performance-primary-shell ${
          isScrolled ? "is-scrolled nav-hairline" : ""
        }`}
      >
        <div
          className="performance-primary-inner nav-brand-top"
        >
          <Link href="/" className="group min-w-0">
            <span className="block text-[0.7rem] font-medium uppercase tracking-[0.38em] text-[var(--nav-top-muted,var(--color-muted))] transition group-hover:text-[var(--nav-top-ink,var(--color-ink))]">
              {parentBrandName}
            </span>
            <span className="mt-1 block font-display text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--nav-top-ink,var(--color-ink))]">
              {companyName}
            </span>
          </Link>

          <nav
            className="hidden items-center gap-7 lg:flex"
            aria-label="Primary navigation"
          >
            <div
              className="relative"
              data-desktop-menu
            >
              <button
                type="button"
                className={`group relative inline-flex items-center gap-1.5 text-[0.82rem] uppercase tracking-[0.18em] transition ${
                  servicesActive
                    ? "text-[var(--nav-top-ink,var(--color-ink))]"
                    : "text-[var(--nav-top-muted,var(--color-muted))] hover:text-[var(--nav-top-ink,var(--color-ink))]"
                }`}
                aria-expanded={desktopMenu === "services"}
                aria-haspopup="true"
                onClick={() =>
                  setDesktopMenu((current) =>
                    current === "services" ? null : "services",
                  )
                }
              >
                Services
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    desktopMenu === "services" ? "rotate-180" : ""
                  }`}
                />
                <span
                  className={`absolute -bottom-2 left-0 h-px bg-[var(--color-accent)] transition-all duration-300 ${
                    servicesActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </button>

              <div
                className={`absolute left-0 top-full pt-5 transition ${
                  desktopMenu === "services"
                    ? "visible translate-y-0 opacity-100"
                    : "invisible -translate-y-1 opacity-0"
                }`}
              >
                <div className="paper-panel w-[22rem] rounded-[1.3rem] p-3 shadow-[0_24px_60px_rgba(17,15,12,0.14)] backdrop-blur-xl">
                  {serviceItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block rounded-[0.9rem] px-4 py-3 transition hover:bg-[var(--color-surface)] focus:bg-[var(--color-surface)] focus:outline-none"
                    >
                      <span className="block text-sm font-semibold text-[var(--color-ink)]">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[var(--color-muted)]">
                        {item.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {primaryItems.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group relative text-[0.82rem] uppercase tracking-[0.18em] transition ${
                    active
                      ? "text-[var(--nav-top-ink,var(--color-ink))]"
                      : "text-[var(--nav-top-muted,var(--color-muted))] hover:text-[var(--nav-top-ink,var(--color-ink))]"
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
            <div
              className="relative"
              data-desktop-menu
            >
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[var(--nav-top-muted,var(--color-muted))] transition hover:text-[var(--color-accent)]"
                aria-expanded={desktopMenu === "client"}
                aria-haspopup="true"
                onClick={() =>
                  setDesktopMenu((current) =>
                    current === "client" ? null : "client",
                  )
                }
              >
                Client Access
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    desktopMenu === "client" ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`absolute right-0 top-full pt-5 transition ${
                  desktopMenu === "client"
                    ? "visible translate-y-0 opacity-100"
                    : "invisible -translate-y-1 opacity-0"
                }`}
              >
                <div className="paper-panel w-[21rem] rounded-[1.3rem] p-3 shadow-[0_24px_60px_rgba(17,15,12,0.14)] backdrop-blur-xl">
                  <p className="px-4 pb-2 pt-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                    Client sign in
                  </p>
                  {clientItems.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="block rounded-[0.9rem] px-4 py-3 transition hover:bg-[var(--color-surface)] focus:bg-[var(--color-surface)] focus:outline-none"
                    >
                      <span className="block text-sm font-semibold text-[var(--color-ink)]">
                        {item.label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[var(--color-muted)]">
                        {item.description}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border-b border-[var(--nav-top-border,var(--color-border-strong))] pb-1 text-[0.82rem] uppercase tracking-[0.18em] text-[var(--nav-top-ink,var(--color-ink))] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Discuss Performance
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
            onClick={toggleMobileMenu}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label="Toggle navigation"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-navigation"
        hidden={!isOpen}
        className={`mx-auto mt-4 max-w-[88rem] overflow-hidden transition-all duration-400 lg:hidden ${
          isOpen ? "max-h-[46rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="paper-panel max-h-[calc(100vh-8rem)] overflow-y-auto rounded-[1.35rem] px-6 py-6 backdrop-blur-xl">
          <p className="eyebrow-label">Explore</p>
          <nav className="mt-5 grid gap-1" aria-label="Mobile navigation">
            {[
              { href: "/#performance-framework", label: "Services" },
              ...primaryItems,
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[0.8rem] px-3 py-2.5 text-lg tracking-[-0.03em] text-[var(--color-ink)] transition hover:bg-[var(--color-surface)]"
                onClick={closeMobileMenu}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-6 border-t border-[var(--color-border-soft)] pt-6">
            <p className="eyebrow-label">Specialties</p>
            <nav className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-3">
              {serviceItems.slice(1).map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="rounded-[0.8rem] px-3 py-2.5 text-sm text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]"
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-6 border-t border-[var(--color-border-soft)] pt-6">
            <p className="eyebrow-label">D2D System</p>
            <div className="mt-4 grid gap-2">
              <a
                href={marketingUrl}
                className="rounded-[0.9rem] border border-[var(--color-border-soft)] px-4 py-3"
                onClick={closeMobileMenu}
              >
                <span className="block text-sm font-semibold text-[var(--color-ink)]">
                  D2D Marketing / Main
                </span>
                <span className="mt-1 block text-xs text-[var(--color-muted)]">
                  Brand clarity and marketing direction
                </span>
              </a>
              <a
                href={digitalUrl}
                className="rounded-[0.9rem] border border-[var(--color-border-soft)] px-4 py-3"
                onClick={closeMobileMenu}
              >
                <span className="block text-sm font-semibold text-[var(--color-ink)]">
                  D2D Digital
                </span>
                <span className="mt-1 block text-xs text-[var(--color-muted)]">
                  Websites, tools, and connected systems
                </span>
              </a>
              <Link
                href="/#top"
                aria-current="page"
                className="rounded-[0.9rem] border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-4 py-3"
                onClick={closeMobileMenu}
              >
                <span className="block text-sm font-semibold text-[var(--color-ink)]">
                  D2D Performance
                </span>
                <span className="mt-1 block text-xs text-[var(--color-muted)]">
                  Revenue, information systems, and measured improvement
                </span>
              </Link>
            </div>
          </div>

          <div className="mt-6 border-t border-[var(--color-border-soft)] pt-6">
            <p className="eyebrow-label">Client Access</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {clientItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-[0.9rem] border border-[var(--color-border-soft)] px-4 py-3 transition hover:border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                  onClick={closeMobileMenu}
                >
                  <span className="block text-sm font-semibold text-[var(--color-ink)]">
                    {item.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[var(--color-muted)]">
                    {item.description}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <Link
            href="/contact"
            className="mt-6 flex items-center justify-between rounded-[0.9rem] bg-[var(--color-charcoal)] px-4 py-3 text-sm uppercase tracking-[0.16em] text-white"
            onClick={closeMobileMenu}
          >
            Discuss Performance
            <MoveRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
