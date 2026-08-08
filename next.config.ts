import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
