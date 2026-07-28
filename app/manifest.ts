import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DAY2DAY Marketing",
    short_name: "D2D Marketing",
    description:
      "Brand strategy, marketing direction, leadership alignment, and practical growth support.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f6f2",
    theme_color: "#1f2933",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
