"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PortalNav({ items }: { items: Array<{ href: string; label: string }> }) {
  const pathname = usePathname();

  if (!items.length) return null;

  return (
    <nav aria-label="Site Manager" className="mt-6 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">
      {items.map((item, index) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`portal-nav-link ${active ? "portal-nav-link-active" : ""}`}
          >
            <span className="portal-nav-number">{String(index + 1).padStart(2, "0")}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
