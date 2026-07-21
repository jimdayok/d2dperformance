import Link from "next/link";
import { signOut } from "@/app/(portal)/portal/login/actions";
import type { SiteDefinition, UserAccess } from "@/lib/site-manager/types";
import { hasRole } from "@/lib/site-manager/permissions";

export function PortalShell({ children, definition, access, displayName, siteCount }: { children: React.ReactNode; definition: SiteDefinition | null; access: UserAccess | null; displayName: string; siteCount: number }) {
  const nav = definition?.navigation.filter((item) => !item.requiredRole || (access && hasRole(access, item.requiredRole))) ?? [];
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-b border-black/10 bg-[#17211d] px-5 py-5 text-white lg:min-h-screen lg:border-r lg:border-b-0">
        <Link href="/portal/dashboard" className="block"><span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d4aa83]">D2D Performance</span><span className="mt-1 block font-display text-2xl">Site Manager</span></Link>
        {definition ? <div className="mt-7 rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs text-white/55">Current website</p><p className="mt-1 text-sm font-semibold">{definition.name}</p>{siteCount > 1 ? <Link href="/portal/dashboard" className="mt-2 block text-xs text-[#d4aa83]">Switch site</Link> : null}</div> : null}
        <nav aria-label="Site Manager" className="mt-6 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">{nav.map((item) => <Link key={item.href} href={item.href} className="rounded-lg px-3 py-2 text-sm text-white/72 hover:bg-white/8 hover:text-white">{item.label}</Link>)}</nav>
        <div className="mt-8 border-t border-white/10 pt-4 text-xs text-white/60"><Link href="/portal/account" className="text-white underline underline-offset-4">{displayName}</Link><p className="mt-1 capitalize">{access?.isPlatformAdmin ? "Platform administrator" : access?.role?.replace("_", " ") ?? "Account"}</p><form action={signOut}><button className="mt-3 text-white underline underline-offset-4">Sign out</button></form></div>
      </aside>
      <div><header className="flex min-h-16 items-center justify-between border-b border-black/10 bg-white px-5 lg:px-8"><p className="text-sm font-semibold">{definition?.name ?? "Websites"}</p>{process.env.NODE_ENV !== "production" ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">{process.env.NODE_ENV}</span> : null}</header><main className="p-5 lg:p-8">{children}</main></div>
    </div>
  );
}
