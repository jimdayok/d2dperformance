import Link from "next/link";
import { PortalShell } from "@/components/site-manager/portal-shell";
import { getAccessibleSites, getCurrentUser } from "@/lib/site-manager/access";

export default async function DashboardPage() {
  const sites = await getAccessibleSites();
  const user = await getCurrentUser();
  return (
    <PortalShell definition={null} access={sites[0]?.access ?? null} displayName={user?.user_metadata?.display_name ?? user?.email ?? "Account"} siteCount={sites.length}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9a5f34]">Dashboard</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Your websites</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {sites.map(({ site, access }) => (
            <article key={site.id} className="rounded-2xl border border-black/10 bg-white p-6">
              <div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-2xl font-semibold">{site.name}</h2><p className="mt-1 text-sm capitalize text-black/55">{site.publishing_mode.replaceAll("_", " ")}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800">Active</span></div>
              <div className="mt-6 flex gap-4"><Link href={`/portal/sites/${site.slug}`} className="rounded-lg bg-[#18201d] px-4 py-2 text-sm font-semibold !text-white">Manage site</Link><a href={site.production_url} target="_blank" rel="noreferrer" className="px-2 py-2 text-sm font-semibold underline">View live site</a></div>
              <p className="mt-5 text-xs text-black/45">Role: {access.isPlatformAdmin ? "Platform administrator" : access.role?.replace("_", " ")}</p>
            </article>
          ))}
        </div>
        {sites.length === 0 ? <p className="mt-8 rounded-xl bg-white p-5">Your account is valid, but it has not been assigned to a website. Contact D2D Performance.</p> : null}
      </div>
    </PortalShell>
  );
}
