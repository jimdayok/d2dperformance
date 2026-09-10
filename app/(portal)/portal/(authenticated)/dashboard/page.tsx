import Link from "next/link";
import { ArrowRight, ExternalLink, FolderHeart, Globe2, Share2 } from "lucide-react";
import { PortalShell } from "@/components/site-manager/portal-shell";
import { getAccessibleSites, getCurrentUser } from "@/lib/site-manager/access";
import { getProductAccess } from "@/lib/d2d-platform/access";
import { getProductLaunchHref } from "@/lib/d2d-platform/product-navigation";

const productDetails = {
  social: { name: "D2D Social", description: "Review marketing plans, share sales and specials, approve social content, and monitor scheduled work.", icon: Share2 },
  brand_vault: { name: "Brand Vault", description: "Keep approved logos, photography, and brand files organized in one secure customer library.", icon: FolderHeart },
  web_management: { name: "Web Management", description: "Review website content, publishing status, and feedback for D2D-managed websites.", icon: Globe2 },
} as const;

export default async function DashboardPage() {
  const sites = await getAccessibleSites();
  const user = await getCurrentUser();
  const productAccess = await getProductAccess();
  const products = [...new Map(productAccess.map((access) => [`${access.organizationId}:${access.product}`, access])).values()];
  return (
    <PortalShell definition={null} access={sites[0]?.access ?? null} displayName={user?.user_metadata?.display_name ?? user?.email ?? "Account"} siteCount={sites.length}>
      <div>
        <div className="border-b border-[#241c17]/12 pb-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9a5f34]">D2D Account</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Your services</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6258]">One account for the D2D tools and customer work your organization is authorized to use.</p>
        </div>
        <div className="mt-8 grid gap-5 xl:grid-cols-3">
          {products.map((product) => {
            const details = productDetails[product.product];
            const Icon = details.icon;
            const internalHref = getProductLaunchHref(product, sites);
            const external = internalHref.startsWith("http");
            const actionLabel = product.product === "web_management" && !external
              ? "Open website editor"
              : "Open service";
            return <article key={`${product.organizationId}:${product.product}`} className="portal-site-card p-6">
              <div className="flex items-start justify-between gap-4"><span className="grid size-11 place-items-center border border-[#9a5f34]/20 bg-[#9a5f34]/8 text-[#9a5f34]"><Icon size={19} strokeWidth={1.7} /></span><span className="text-xs font-medium text-[#776b61]"><span className="mr-2 inline-block size-1.5 rounded-full bg-emerald-600" />Active</span></div>
              <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a5f34]">{product.organizationName}</p>
              <h2 className="mt-2 font-display text-3xl font-semibold">{details.name}</h2>
              <p className="mt-3 min-h-20 text-sm leading-6 text-[#6d6258]">{details.description}</p>
              <div className="mt-5 border-t border-[#241c17]/10 pt-5">
                {external ? <a href={internalHref} className="portal-primary-button inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold">{actionLabel} <ExternalLink size={14} /></a> : <Link href={internalHref} className="portal-primary-button inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold">{actionLabel} <ArrowRight size={15} /></Link>}
              </div>
            </article>;
          })}
        </div>
        {products.length === 0 ? <p className="portal-panel mt-8 p-5">Your D2D Account is active, but no services have been assigned yet. Contact D2D Marketing.</p> : null}
        {sites.length > 0 ? <div className="mt-12 border-b border-[#241c17]/12 pb-5"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9a5f34]">Web Management</p><h2 className="mt-2 font-display text-3xl font-semibold">Your websites</h2></div> : null}
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
      </div>
    </PortalShell>
  );
}
