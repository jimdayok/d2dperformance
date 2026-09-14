import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, SearchCheck, type LucideIcon } from "lucide-react";

type Platform = {
  name: string;
  description: string;
  href: string;
  rhythm: string;
  className: string;
  external?: boolean;
  logo?: string;
  mark?: string;
  icon?: LucideIcon;
};

const platforms: Platform[] = [
  {
    name: "D2D Brand Discovery",
    description:
      "Clarify the business, audience, positioning and brand direction in one guided experience.",
    href: "/brand-development#brand-discovery",
    rhythm: "Discover / Clarify / Begin",
    className: "is-discovery",
    icon: SearchCheck,
  },
  {
    name: "D2D Social Pages",
    description: "Plan, review, approve and publish social content.",
    logo: "/assets/platforms/d2d-social-pages-logo.png",
    mark: "/assets/platforms/d2d-social-pages-mark.png",
    href: "https://social.d2dperformance.com/login",
    rhythm: "Plan / Approve / Publish",
    className: "is-social",
    external: true,
  },
  {
    name: "D2D Site Manager",
    description: "Manage site content and day-to-day digital operations.",
    logo: "/assets/platforms/d2d-site-manager-logo.png",
    mark: "/assets/platforms/d2d-site-manager-mark.png",
    href: "https://webadmin.d2dmktg.com/portal/login",
    rhythm: "Update / Manage / Improve",
    className: "is-site-manager",
    external: true,
  },
  {
    name: "D2D Brand Vault",
    description: "Organize approved logos, images, standards and shared files.",
    logo: "/assets/platforms/d2d-brand-vault-logo.png",
    mark: "/assets/platforms/d2d-brand-vault-mark.png",
    href: "https://brandvault.d2dmktg.com/auth/login",
    rhythm: "Organize / Approve / Protect",
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
            <p className="performance-platforms-eyebrow">D2D Performance Platforms</p>
            <h2 className="font-display">
              Operational tools that keep the DAY2DAY moving.
            </h2>
          </div>
          <p>
            D2D Performance houses the connected platform layer—practical
            places for clients to plan, approve, publish, update and protect
            the work.
          </p>
        </div>

        <div className="performance-platform-grid">
          {platforms.map((platform) => {
            const PlatformIcon = platform.icon;
            const linkContent = (
              <>
                Open {platform.name}
                <ArrowUpRight aria-hidden="true" />
              </>
            );

            return (
              <article
                className={`performance-platform-card ${platform.className}`}
                key={platform.name}
              >
                <div className="performance-platform-logo">
                  {platform.logo ? (
                    <Image
                      src={platform.logo}
                      alt={`${platform.name} logo`}
                      width={2827}
                      height={631}
                      sizes="(max-width: 760px) 82vw, 42vw"
                    />
                  ) : (
                    <div className="performance-platform-wordmark" aria-hidden="true">
                      <span>D2D</span>
                      <strong>Brand Discovery</strong>
                      <small>Start with clarity</small>
                    </div>
                  )}
                </div>

                <h3 className="font-display">{platform.name}</h3>
                <p className="performance-platform-description">
                  {platform.description}
                </p>

                <div className="performance-platform-detail">
                  {platform.mark ? (
                    <Image
                      className="performance-platform-mark"
                      src={platform.mark}
                      alt=""
                      width={1024}
                      height={1024}
                      sizes="76px"
                    />
                  ) : (
                    <span className="performance-platform-mark performance-platform-icon" aria-hidden="true">
                      {PlatformIcon ? <PlatformIcon /> : null}
                    </span>
                  )}
                  <div>
                    <span>{platform.icon ? "Guided tool" : "App / favicon"}</span>
                    <strong>{platform.rhythm}</strong>
                  </div>
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

        <p className="performance-platforms-footer">
          One D2D system / Clearer ownership / Better day-to-day control
        </p>
      </div>
    </section>
  );
}
