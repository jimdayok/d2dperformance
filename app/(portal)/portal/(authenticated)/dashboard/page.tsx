import Link from "next/link";
import { ArrowRight, ChevronDown, ExternalLink, FolderHeart, Globe2, Share2 } from "lucide-react";
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
  const [sites, user, productAccess] = await Promise.all([
    getAccessibleSites(),
    getCurrentUser(),
    getProductAccess(),
  ]);
  const products = [...new Map(productAccess.map((access) => [`${access.organizationId}:${access.product}`, access])).values()];
  const customers = Array.from(products.reduce((grouped, product) => {
    const existing = grouped.get(product.organizationId);
    if (existing) existing.products.push(product);
    else grouped.set(product.organizationId, {
      organizationId: product.organizationId,
      organizationName: product.organizationName,
      products: [product],
    });
    return grouped;
  }, new Map<string, { organizationId: string; organizationName: string; products: typeof products }>()).values())
    .sort((a, b) => a.organizationName.localeCompare(b.organizationName));
  return (
    <PortalShell definition={null} access={sites[0]?.access ?? null} displayName={user?.user_metadata?.display_name ?? user?.email ?? "Account"} siteCount={sites.length}>
      <div>
        <div className="border-b border-[#241c17]/12 pb-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9a5f34]">D2D Account</p>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Your services</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6258]">One account for the D2D tools and customer work your organization is authorized to use.</p>
        </div>
        <div className="mt-8 grid gap-4">
          {customers.map((customer) => (
            <details key={customer.organizationId} className="portal-panel group overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 p-6 marker:hidden sm:p-7">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9a5f34]">Customer</p>
                  <h2 className="mt-2 font-display text-3xl font-semibold">{customer.organizationName}</h2>
                  <p className="mt-2 text-sm text-[#6d6258]">{customer.products.length} active {customer.products.length === 1 ? "service" : "services"}</p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center border border-[#9a5f34]/20 bg-[#9a5f34]/8 text-[#9a5f34] transition-transform group-open:rotate-180"><ChevronDown size={19} /></span>
              </summary>
              <div className="grid gap-5 border-t border-[#241c17]/10 bg-[#f4f0e9] p-5 md:grid-cols-2 xl:grid-cols-3 sm:p-7">
                {customer.products.map((product) => {
                  const details = productDetails[product.product];
                  const Icon = details.icon;
                  const internalHref = getProductLaunchHref(product, sites);
                  const external = internalHref.startsWith("http");
                  const actionLabel = product.product === "web_management" && !external ? "Open website editor" : "Open service";
                  return <article key={`${product.organizationId}:${product.product}`} className="portal-site-card p-6">
                    <div className="flex items-start justify-between gap-4"><span className="grid size-11 place-items-center border border-[#9a5f34]/20 bg-[#9a5f34]/8 text-[#9a5f34]"><Icon size={19} strokeWidth={1.7} /></span><span className="text-xs font-medium text-[#776b61]"><span className="mr-2 inline-block size-1.5 rounded-full bg-emerald-600" />Active</span></div>
                    <h3 className="mt-7 font-display text-3xl font-semibold">{details.name}</h3>
                    <p className="mt-3 min-h-20 text-sm leading-6 text-[#6d6258]">{details.description}</p>
                    <div className="mt-5 border-t border-[#241c17]/10 pt-5">
                      {external ? <a href={internalHref} className="portal-primary-button inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold">{actionLabel} <ExternalLink size={14} /></a> : <Link href={internalHref} className="portal-primary-button inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold">{actionLabel} <ArrowRight size={15} /></Link>}
                    </div>
                  </article>;
                })}
              </div>
            </details>
          ))}
        </div>
        {products.length === 0 ? <p className="portal-panel mt-8 p-5">Your D2D Account is active, but no services have been assigned yet. Contact D2D Marketing.</p> : null}
      </div>
    </PortalShell>
  );
}
