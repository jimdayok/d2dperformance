import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-data";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal", "/api/cms"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
