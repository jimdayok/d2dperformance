import { CustomToolsSection } from "@/sections/home/custom-tools";
import { HomeHero } from "@/sections/home/hero";
import { HomeProcessSection } from "@/sections/home/process";
import { ResultsSection } from "@/sections/home/results";
import { ServicesGridSection } from "@/sections/home/services-grid";
import { WhatWeDoSection } from "@/sections/home/what-we-do";
import { WhyStallSection } from "@/sections/home/why-stall";
import { OperationalToolsSection } from "@/sections/home/operational-tools";
import { companyName, siteUrl } from "@/lib/site-data";
import { createMetadata, sanitizeJsonLd } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Digital Tools, Portals & Business Dashboards",
  description:
    "Custom digital tools, customer portals, dashboards, and connected workflows built around your business.",
});

const homeJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: companyName,
  url: siteUrl,
  description:
    "D2D Performance builds custom digital tools, customer portals, business dashboards, and connected workflows for day-to-day operations.",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(homeJsonLd) }}
      />
      <HomeHero />
      <OperationalToolsSection />
      <CustomToolsSection />
      <WhatWeDoSection />
      <WhyStallSection />
      <HomeProcessSection />
      <ServicesGridSection />
      <ResultsSection />
    </>
  );
}
