"use client";

import { useEffect } from "react";

type MobileScrollHeaderProps = {
  breakpoint: number;
  ecosystemSelector: string;
  headerSelector: string;
  menuSelector: string;
};

const compactClass = "is-mobile-compact";
const compactDelay = 1800;
const compactScrollThreshold = 96;

export function MobileScrollHeader({
  breakpoint,
  ecosystemSelector,
  headerSelector,
  menuSelector,
}: MobileScrollHeaderProps) {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(headerSelector);
    const ecosystem =
      document.querySelector<HTMLElement>(ecosystemSelector);
    const menu = document.querySelector<HTMLDetailsElement>(menuSelector);
    const mobile = window.matchMedia(`(max-width: ${breakpoint}px)`);
    let compactTimer: number | undefined;

    if (!header || !ecosystem || !menu) {
      return;
    }

    function clearCompactTimer() {
      if (compactTimer !== undefined) {
        window.clearTimeout(compactTimer);
        compactTimer = undefined;
      }
    }

    function setCompact(compact: boolean) {
      header?.classList.toggle(compactClass, compact);
      ecosystem?.classList.toggle(compactClass, compact);
    }

    function updateHeader() {
      const shouldRemainFull =
        !mobile.matches ||
        window.scrollY < compactScrollThreshold ||
        menu?.open;

      if (shouldRemainFull) {
        clearCompactTimer();
        setCompact(false);
        return;
      }

      if (
        compactTimer === undefined &&
        !header?.classList.contains(compactClass)
      ) {
        compactTimer = window.setTimeout(() => {
          compactTimer = undefined;

          if (
            mobile.matches &&
            window.scrollY >= compactScrollThreshold &&
            !menu?.open
          ) {
            setCompact(true);
          }
        }, compactDelay);
      }
    }

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    menu.addEventListener("toggle", updateHeader);
    mobile.addEventListener("change", updateHeader);

    return () => {
      clearCompactTimer();
      setCompact(false);
      window.removeEventListener("scroll", updateHeader);
      menu.removeEventListener("toggle", updateHeader);
      mobile.removeEventListener("change", updateHeader);
    };
  }, [breakpoint, ecosystemSelector, headerSelector, menuSelector]);

  return null;
}
