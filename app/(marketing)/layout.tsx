import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { PublicPagePolish } from "@/components/public-page-polish";
import { companyName, siteUrl } from "@/lib/site-data";
import { sanitizeJsonLd } from "@/lib/metadata";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: companyName,
  url: siteUrl,
  description:
    "Executive performance consulting for owners, founders, and leadership teams building companies that scale.",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-bg">
      <PublicPagePolish
        rootSelector=".site-bg"
        targetSelector=".public-site-main > section, .public-site-main > div > section"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(organizationJsonLd) }}
      />
      <SiteHeader />
      <main className="public-site-main">{children}</main>
      <SiteFooter />
    </div>
  );
}
