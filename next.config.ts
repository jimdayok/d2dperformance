import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/api/social-ai": ["./node_modules/ffmpeg-static/ffmpeg", "./public/social-ai/original-instrumental.wav"] },
  async redirects() {
    return [
      {
        source: "/performance",
        destination: "/",
        permanent: true,
      },
      {
        source: "/why-d2d",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/why-d2d-1",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/better-together",
        destination: "/about#better-together",
        permanent: true,
      },
      {
        source: "/client-brand-library",
        destination: "https://brandvault.d2dmktg.com",
        permanent: true,
      },
      {
        source: "/official-kajabi-partner",
        destination: "/services",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
