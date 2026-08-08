import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteAnalytics } from "@/components/site-analytics";
import { companyName, siteUrl, tagline } from "@/lib/site-data";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${companyName} | Revenue Improvement & Business Intelligence`,
    template: `%s | ${companyName}`,
  },
  description:
    "D2D Performance helps leadership teams improve revenue and operations through objective analysis, dashboards, business information systems, and practical technology advisory.",
  applicationName: companyName,
  category: "business",
  openGraph: {
    type: "website",
    siteName: companyName,
    title: `${companyName} | Revenue Improvement & Business Intelligence`,
    description:
      "Improve revenue and operations with decision-ready dashboards, connected business information, objective analysis, and practical technology advisory.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${ibmPlexSans.variable} ${fraunces.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full bg-[var(--color-bg)] font-sans text-[var(--color-ink)] antialiased">
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <SiteAnalytics />
      </body>
    </html>
  );
}
