import Link from "next/link";
import { ArrowUpRight, CircleHelp, Globe2, MessageSquareText } from "lucide-react";
import { signOut } from "@/app/(portal)/portal/login/actions";
import type { SiteDefinition, UserAccess } from "@/lib/site-manager/types";
import { hasRole } from "@/lib/site-manager/permissions";
import { PortalNav } from "@/components/site-manager/portal-nav";

export function PortalShell({ children, definition, access, displayName, siteCount }: { children: React.ReactNode; definition: SiteDefinition | null; access: UserAccess | null; displayName: string; siteCount: number }) {
  const nav = definition?.navigation.filter((item) => !item.requiredRole || (access && hasRole(access, item.requiredRole))) ?? [];
  const feedbackToolOrigin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://performance.d2dmktg.com";
  return (
    <div className="portal-shell min-h-screen lg:grid lg:grid-cols-[19rem_minmax(0,1fr)]">
      <aside className="portal-sidebar border-b border-white/10 px-5 py-5 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0 lg:px-6 lg:py-7">
        <Link href="/portal/dashboard" className="group flex items-center gap-3">
          <span className="grid size-11 place-items-center border border-[#d6a77f]/55 bg-[#d6a77f] text-sm font-semibold tracking-[-0.08em] text-[#17201d] transition-transform group-hover:-rotate-2">D2D</span>
          <span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.32em] text-[#d6a77f]">Marketing</span>
            <span className="mt-1 block font-display text-[1.65rem] leading-none">Site Manager</span>
          </span>
        </Link>

        <div className="mt-8 border-t border-white/12 pt-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/38">Content operations</p>
          {definition ? (
            <div className="mt-3 border-l-2 border-[#d6a77f] bg-white/[0.055] px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-white/42">Current website</p>
              <p className="mt-1.5 text-sm font-semibold text-white">{definition.name}</p>
              {siteCount > 1 ? <Link href="/portal/dashboard" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#d6a77f]">Switch website <ArrowUpRight size={12} /></Link> : null}
            </div>
          ) : (
            <p className="mt-3 max-w-48 text-sm leading-6 text-white/58">Choose a website to review content and publishing activity.</p>
          )}
        </div>

        <PortalNav items={nav} />

        <div className="mt-6 grid grid-cols-2 gap-2 lg:mt-auto lg:grid-cols-1">
          {definition ? <a href={`${feedbackToolOrigin}/digital/website-feedback?site=${encodeURIComponent(definition.key)}&url=${encodeURIComponent(definition.productionUrl)}`} target="_blank" rel="noreferrer" className="portal-sidebar-link"><MessageSquareText size={15} /> Website feedback</a> : null}
          {access?.isPlatformAdmin ? <Link href="/portal/feedback" className="portal-sidebar-link"><MessageSquareText size={15} /> Feedback repository</Link> : null}
          <a href="https://d2dmktg.com" target="_blank" rel="noreferrer" className="portal-sidebar-link">
            <Globe2 size={15} /> D2D Marketing
          </a>
          <a href="mailto:andrea@d2dmktg.com" className="portal-sidebar-link">
            <CircleHelp size={15} /> Support
          </a>
        </div>
        <div className="mt-5 border-t border-white/12 pt-4 text-xs text-white/58">
          <Link href="/portal/account" className="block truncate font-semibold text-white">{displayName}</Link>
          <p className="mt-1 capitalize">{access?.isPlatformAdmin ? "Platform administrator" : access?.role?.replace("_", " ") ?? "Account"}</p>
          <form action={signOut}><button className="mt-3 font-semibold text-[#d6a77f] underline decoration-[#d6a77f]/45 underline-offset-4">Sign out</button></form>
        </div>
      </aside>
      <div className="portal-workspace min-w-0">
        <header className="portal-topbar flex min-h-[4.5rem] items-center justify-between gap-4 px-5 lg:px-9">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9a5f34]">D2D control center</p>
            <p className="mt-1 text-sm font-semibold text-[#27231f]">{definition?.name ?? "Website portfolio"}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-xs font-medium text-[#6d6258] sm:flex"><span className="size-1.5 rounded-full bg-emerald-600" /> Systems operational</span>
            {process.env.NODE_ENV !== "production" ? <span className="rounded-full border border-amber-900/15 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{process.env.NODE_ENV}</span> : null}
          </div>
        </header>
        <main className="portal-content p-5 sm:p-7 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
