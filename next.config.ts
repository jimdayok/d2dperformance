import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {proxyClientMaxBodySize:"105mb"},
  outputFileTracingIncludes: { "/api/social-ai": ["./node_modules/ffmpeg-static/ffmpeg", "./public/social-ai/original-instrumental.wav", "./public/social-ai/fonts/*", "./public/social-ai/fonts.conf"] },
  async rewrites() {
    if(process.env.D2D_STUDIO_STAGING!=="true")return [];
    return [{source:"/_staging/supabase/:path*",destination:"http://127.0.0.1:54321/:path*"},{source:"/_staging/vault/:path*",destination:process.env.BRAND_VAULT_SUPABASE_URL+"/:path*"}];
  },
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
