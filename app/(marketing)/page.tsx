import { BrandDiscoveryForm } from "@/components/brand-discovery-form";
import { BrandCtaSection } from "@/sections/home/brand-cta";
import { HomeHero } from "@/sections/home/hero";
import { HomeProcessSection } from "@/sections/home/process";
import { ResultsSection } from "@/sections/home/results";
import { ServicesGridSection } from "@/sections/home/services-grid";
import { WhatWeDoSection } from "@/sections/home/what-we-do";
import { WhyStallSection } from "@/sections/home/why-stall";
import { companyName, siteUrl } from "@/lib/site-data";
import { createMetadata, sanitizeJsonLd } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Build a Better Business",
  description:
    "Executive consulting for leadership teams that need clearer strategy, stronger execution, and scalable growth.",
});

const homeJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: companyName,
  url: siteUrl,
  description:
    "D2D Performance helps business owners and leadership teams scale through strategy, leadership, systems, execution, and brand clarity.",
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(homeJsonLd) }}
      />
      <HomeHero />
      <BrandDiscoveryForm />
      <WhatWeDoSection />
      <WhyStallSection />
      <HomeProcessSection />
      <ServicesGridSection />
      <BrandCtaSection />
      <ResultsSection />
    </>
  );
}
