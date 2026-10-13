import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ChartNoAxesCombined, FileChartColumn, ArrowUpRight } from "lucide-react";
import { getPlatformAdminStatus } from "@/lib/d2d-platform/access";
import { getCurrentUser, getAccessibleSites } from "@/lib/site-manager/access";
import { PortalShell } from "@/components/site-manager/portal-shell";

export const metadata = {
  title: "D2D Analytics | Administration",
  robots: { index: false, follow: false },
};

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/portal/login");
  if (!(await getPlatformAdminStatus())) redirect("/portal/dashboard");
  const sites = await getAccessibleSites();
  return <PortalShell definition={null} access={sites[0]?.access ?? null} displayName={user.email ?? "Account"} siteCount={sites.length}>
    <div className="max-w-5xl">
      <Link href="/portal/admin/products" className="text-sm font-semibold text-[#9a5f34] underline underline-offset-4">Administration</Link>
      <header className="mt-6 rounded-xl bg-[#302235] p-7 text-white sm:p-9">
        <Image src="/assets/reporting/d2d-mark.png" alt="D2D Marketing" width={100} height={50} className="h-auto w-24" />
        <p className="mt-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#edb2ce]"><ChartNoAxesCombined size={18} aria-hidden="true" /> Client insights &amp; reporting</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">D2D Analytics</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/80">Understand each client’s online performance and turn verified results into clear, personalized reports.</p>
      </header>
      <section aria-labelledby="report-tools" className="mt-8">
        <h2 id="report-tools" className="font-display text-2xl">Reporting tools</h2>
        <article className="portal-panel mt-4 rounded-xl border p-6 sm:p-8">
          <FileChartColumn size={30} className="text-[#9a5f34]" aria-hidden="true" />
          <h3 className="mt-4 font-display text-2xl">Client performance reports</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6258]">Create a first review to establish a starting point, then prepare monthly reviews showing what changed. Add the client’s logo, clear graphs, findings, and next steps.</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6258]">Choose a customer, save their reporting settings, and create a PDF draft. Every report must be reviewed, approved, and sent with a separate Send Report button. Approval never sends a report.</p>
          <Link href="/portal/reports" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#302235] px-5 py-3 font-semibold text-white">Create &amp; manage reports <ArrowUpRight size={18} aria-hidden="true" /></Link>
          <p className="mt-4 text-xs leading-5 text-[#6d6258]">Only documented measurements belong in client reports. Unavailable results stay clearly labeled until a source is connected or evidence is entered.</p>
        </article>
      </section>
      <p className="mt-7 text-sm text-[#6d6258]">This is the home for D2D Analytics. Additional tools will appear here as they become available.</p>
    </div>
  </PortalShell>;
}
