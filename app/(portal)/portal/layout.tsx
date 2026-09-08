import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "D2D Account", template: "%s | D2D Account" },
  description: "One secure account for D2D Social, Brand Vault, and Web Management.",
  robots: { index: false, follow: false, nocache: true },
};

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="portal-root min-h-screen">{children}</div>;
}
