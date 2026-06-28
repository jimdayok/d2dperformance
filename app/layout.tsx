import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { companyName, siteUrl, tagline } from "@/lib/site-data";
import { sanitizeJsonLd } from "@/lib/metadata";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${companyName} | Executive Performance Consulting`,
    template: `%s | ${companyName}`,
  },
  description:
    "D2D Performance helps leadership teams scale through strategy, leadership, systems, execution, and brand clarity.",
  applicationName: companyName,
  category: "business",
  openGraph: {
    type: "website",
    siteName: companyName,
    title: `${companyName} | Executive Performance Consulting`,
    description:
      "Build a better business through strategy, leadership, systems, and brand clarity.",
    url: siteUrl,
    images: [{ url: "/opengraph-image" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${companyName} | Executive Performance Consulting`,
    description: tagline,
    images: ["/twitter-image"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: companyName,
  url: siteUrl,
  email: "performance@d2dmktg.com",
  description:
    "Executive performance consulting for owners, founders, and leadership teams building companies that scale.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full scroll-smooth`}>
      <body className="min-h-full bg-[var(--color-bg)] font-sans text-[var(--color-ink)] antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: sanitizeJsonLd(organizationJsonLd) }}
        />
        <div className="site-bg">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
