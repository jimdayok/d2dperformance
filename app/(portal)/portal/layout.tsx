import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "D2D Site Manager", template: "%s | D2D Site Manager" },
  description: "Secure website content operations for D2D Performance clients.",
  robots: { index: false, follow: false, nocache: true },
};

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f3f4f2] text-[#18201d]">{children}</div>;
}
