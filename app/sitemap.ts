import type { MetadataRoute } from "next";
import { navigation, siteUrl } from "@/lib/site-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    ...navigation.map((item) => item.href),
    "/digital",
    "/privacy-policy",
    "/sign-up-for-our-newsletter",
    "/terms-of-use",
  ];

  return [...new Set(routes)].map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/privacy-policy" || path === "/terms-of-use" ? 0.3 : 0.7,
  }));
}
