import Link from "next/link";
import { ArrowRight, ExternalLink, Globe2 } from "lucide-react";
import { PortalShell } from "@/components/site-manager/portal-shell";
import { getAccessibleSites, getCurrentUser } from "@/lib/site-manager/access";

export default async function DashboardPage() {
  const sites = await getAccessibleSites();
  const user = await getCurrentUser();
  return (
    <PortalShell definition={null} access={sites[0]?.access ?? null} displayName={user?.user_metadata?.display_name ?? user?.email ?? "Account"} siteCount={sites.length}>
      <div>
        <div className="border-b border-[#241c17]/12 pb-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9a5f34]">Website portfolio</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Your websites</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6258]">Manage approved content, monitor publishing workflow, and keep every D2D-managed website current.</p>
        </div>
        <div className="mt-8 grid gap-5 xl:grid-cols-2">
          {sites.map(({ site, access }, index) => (
            <article key={site.id} className="portal-site-card group relative overflow-hidden p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <span className="grid size-11 place-items-center border border-[#9a5f34]/20 bg-[#9a5f34]/8 text-[#9a5f34]"><Globe2 size={19} strokeWidth={1.7} /></span>
                <span className="text-xs font-medium text-[#776b61]"><span className="mr-2 inline-block size-1.5 rounded-full bg-emerald-600" />Active</span>
              </div>
              <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a5f34]">Website {String(index + 1).padStart(2, "0")}</p>
              <h2 className="mt-2 font-display text-3xl font-semibold">{site.name}</h2>
              <div className="mt-5 grid grid-cols-2 border-y border-[#241c17]/10 py-4 text-xs">
                <div><p className="uppercase tracking-[0.12em] text-[#877b70]">Publishing</p><p className="mt-1 font-semibold capitalize text-[#302a25]">{site.publishing_mode.replaceAll("_", " ")}</p></div>
                <div className="border-l border-[#241c17]/10 pl-4"><p className="uppercase tracking-[0.12em] text-[#877b70]">Your role</p><p className="mt-1 font-semibold capitalize text-[#302a25]">{access.isPlatformAdmin ? "Platform admin" : access.role?.replace("_", " ")}</p></div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href={`/portal/sites/${site.slug}`} className="portal-primary-button inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold">Manage website <ArrowRight size={15} /></Link>
                <a href={site.production_url} target="_blank" rel="noreferrer" className="portal-secondary-button inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold">View live <ExternalLink size={14} /></a>
              </div>
            </article>
          ))}
        </div>
        {sites.length === 0 ? <p className="portal-panel mt-8 p-5">Your account is valid, but it has not been assigned to a website. Contact D2D Marketing.</p> : null}
      </div>
    </PortalShell>
  );
}
