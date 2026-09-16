import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type Platform = {
  name: string;
  category: string;
  description: string;
  href: string;
  action: string;
  logo: string;
  logoWidth: number;
  logoHeight: number;
  className: string;
  external?: boolean;
};

const platforms: Platform[] = [
  {
    name: "D2D Brand Discovery",
    category: "Brand direction",
    description:
      "Clarify the business, audience, positioning and brand direction before the creative work begins.",
    href: "/brand-development#brand-discovery",
    action: "Start Brand Discovery",
    logo: "/assets/platforms/d2d-brand-discovery-logo.png",
    logoWidth: 2827,
    logoHeight: 631,
    className: "is-discovery",
  },
  {
    name: "D2D Social Pages",
    category: "Social planning",
    description: "Plan, review, approve and publish social content.",
    logo: "/assets/platforms/d2d-social-pages-logo.png",
    logoWidth: 2827,
    logoHeight: 631,
    href: "https://social.d2dperformance.com/login",
    action: "Open Social Pages",
    className: "is-social",
    external: true,
  },
  {
    name: "D2D Site Manager",
    category: "Website management",
    description: "Manage site content and day-to-day digital operations.",
    logo: "/assets/platforms/d2d-site-manager-logo.png",
    logoWidth: 2827,
    logoHeight: 631,
    href: "https://webadmin.d2dmktg.com/portal/login",
    action: "Open Site Manager",
    className: "is-site-manager",
    external: true,
  },
  {
    name: "D2D Brand Vault",
    category: "Brand assets",
    description: "Organize approved logos, images, standards and shared files.",
    logo: "/assets/platforms/d2d-brand-vault-logo.png",
    logoWidth: 2827,
    logoHeight: 631,
    href: "https://brandvault.d2dmktg.com/auth/login",
    action: "Open Brand Vault",
    className: "is-brand-vault",
    external: true,
  },
];

export function OperationalToolsSection() {
  return (
    <section className="performance-platforms" id="operational-tools">
      <div className="performance-platforms-inner">
        <div className="performance-platforms-heading">
          <div>
            <p className="performance-platforms-eyebrow">The D2D working system</p>
            <h2 className="font-display">
              Start with direction. Keep the work moving.
            </h2>
          </div>
          <p>
            Four focused destinations for shaping the brand, managing the
            website, approving social content and keeping the right files in
            the right hands.
          </p>
        </div>

        <div className="performance-platform-directory">
          {platforms.map((platform, index) => {
            const linkContent = (
              <>
                {platform.action}
                <ArrowUpRight aria-hidden="true" />
              </>
            );

            return (
              <article
                className={`performance-platform-entry ${platform.className}`}
                key={platform.name}
              >
                <div className="performance-platform-index" aria-hidden="true">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <i />
                </div>

                <div className="performance-platform-identity">
                  <p>{platform.category}</p>
                  <Image
                    src={platform.logo}
                    alt={`${platform.name} logo`}
                    width={platform.logoWidth}
                    height={platform.logoHeight}
                    sizes="(max-width: 760px) 80vw, 340px"
                  />
                </div>

                <div className="performance-platform-copy">
                  <h3 className="font-display">{platform.name}</h3>
                  <p>{platform.description}</p>
                </div>

                {platform.external ? (
                  <a href={platform.href} target="_blank" rel="noreferrer">
                    {linkContent}
                  </a>
                ) : (
                  <Link href={platform.href}>{linkContent}</Link>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
