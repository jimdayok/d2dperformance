import { BrandDiscoveryForm } from "@/components/brand-discovery-form";
import { PageIntro } from "@/components/page-intro";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Brand Development",
  description:
    "Use the D2D Performance brand discovery process to build a complete brand blueprint grounded in business clarity.",
  path: "/brand-development",
});

export default function BrandDevelopmentPage() {
  return (
    <>
      <PageIntro
        eyebrow="Brand Development"
        title="Brand strategy that starts with the business, not the visuals."
        description="This guided discovery is the flagship D2D Performance experience. It helps owners and leadership teams surface the insight required to build a sharp, durable, credible brand blueprint."
        primaryCta={{ href: "#brand-discovery", label: "Start Brand Discovery" }}
        secondaryCta={{ href: "/contact", label: "Talk With D2D" }}
      />
      <BrandDiscoveryForm />
    </>
  );
}
