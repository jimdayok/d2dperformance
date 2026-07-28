import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "D2D Site Manager", template: "%s | D2D Site Manager" },
  description: "Secure website content operations for D2D Marketing clients.",
  robots: { index: false, follow: false, nocache: true },
};

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="portal-root min-h-screen">{children}</div>;
}
