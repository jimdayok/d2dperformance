import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(organizationJsonLd) }}
      />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
