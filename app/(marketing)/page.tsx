import { HomeHero } from "@/sections/home/hero";
import { HomeProcessSection } from "@/sections/home/process";
import { ResultsSection } from "@/sections/home/results";
import { ServicesGridSection } from "@/sections/home/services-grid";
import { WhatWeDoSection } from "@/sections/home/what-we-do";
import { WhyStallSection } from "@/sections/home/why-stall";
import { companyName, siteUrl } from "@/lib/site-data";
import { createMetadata, sanitizeJsonLd } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Revenue Improvement & Business Intelligence",
  description:
    "Objective business analysis, revenue improvement, dashboards, information systems, and technology-supported operating advisory.",
});

const homeJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: companyName,
  url: siteUrl,
  description:
    "D2D Performance helps business owners improve revenue and operations with objective analysis, dashboards, business information systems, and practical technology advisory.",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(homeJsonLd) }}
      />
      <HomeHero />
      <WhatWeDoSection />
      <WhyStallSection />
      <HomeProcessSection />
      <ServicesGridSection />
      <ResultsSection />
    </>
  );
}
