import type { Metadata } from "next";
import { companyName, siteUrl, tagline } from "@/lib/site-data";

type MetadataConfig = {
  title: string;
  description: string;
  path?: string;
};

export function createMetadata({
  title,
  description,
  path = "/",
}: MetadataConfig): Metadata {
  const canonical = new URL(path, siteUrl).toString();

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonical,
      siteName: companyName,
      images: [{ url: new URL("/opengraph-image", siteUrl).toString() }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [new URL("/twitter-image", siteUrl).toString()],
    },
    keywords: [
      companyName,
      tagline,
      "executive consulting",
      "business growth strategy",
      "brand development",
      "executive coaching",
      "operational systems",
    ],
  };
}

export function sanitizeJsonLd<T>(data: T) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
