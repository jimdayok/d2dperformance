"use client";

import { useEffect } from "react";

type PublicPagePolishProps = {
  rootSelector: string;
  targetSelector?: string;
};

export function PublicPagePolish({
  rootSelector,
  targetSelector = "main > section",
}: PublicPagePolishProps) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(rootSelector);

    if (!root) return;

    const sections = Array.from(
      root.querySelectorAll<HTMLElement>(targetSelector),
    );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    sections.forEach((section) => section.classList.add("page-polish-section"));
    root.classList.add("page-polish-ready");

    if (reducedMotion) {
      sections.forEach((section) =>
        section.classList.add("is-polish-visible"),
      );
      return () => {
        root.classList.remove("page-polish-ready");
        sections.forEach((section) =>
          section.classList.remove("page-polish-section", "is-polish-visible"),
        );
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-polish-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -7% 0px", threshold: 0.08 },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      root.classList.remove("page-polish-ready");
      sections.forEach((section) =>
        section.classList.remove("page-polish-section", "is-polish-visible"),
      );
    };
  }, [rootSelector, targetSelector]);

  return null;
}
