import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

const platforms = [
  {
    name: "D2D Social Pages",
    description: "Plan, review, approve and publish social content.",
    logo: "/assets/platforms/d2d-social-pages-logo.png",
    mark: "/assets/platforms/d2d-social-pages-mark.png",
    href: "https://social.d2dperformance.com/login",
    rhythm: "Plan / Approve / Publish",
    className: "is-social",
  },
  {
    name: "D2D Site Manager",
    description: "Manage site content and day-to-day digital operations.",
    logo: "/assets/platforms/d2d-site-manager-logo.png",
    mark: "/assets/platforms/d2d-site-manager-mark.png",
    href: "https://webadmin.d2dmktg.com/portal/login",
    rhythm: "Update / Manage / Improve",
    className: "is-site-manager",
  },
  {
    name: "D2D Brand Vault",
    description: "Organize approved logos, images, standards and shared files.",
    logo: "/assets/platforms/d2d-brand-vault-logo.png",
    mark: "/assets/platforms/d2d-brand-vault-mark.png",
    href: "https://brandvault.d2dmktg.com/auth/login",
    rhythm: "Organize / Approve / Protect",
    className: "is-brand-vault",
  },
] as const;

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
          {platforms.map((platform) => (
            <article
              className={`performance-platform-card ${platform.className}`}
              key={platform.name}
            >
              <div className="performance-platform-logo">
                <Image
                  src={platform.logo}
                  alt={`${platform.name} logo`}
                  width={2827}
                  height={631}
                  sizes="(max-width: 760px) 82vw, 28vw"
                />
              </div>

              <h3 className="font-display">{platform.name}</h3>
              <p className="performance-platform-description">
                {platform.description}
              </p>

              <div className="performance-platform-detail">
                <Image
                  src={platform.mark}
                  alt=""
                  width={1024}
                  height={1024}
                  sizes="76px"
                />
                <div>
                  <span>App / favicon</span>
                  <strong>{platform.rhythm}</strong>
                </div>
              </div>

              <a href={platform.href} target="_blank" rel="noreferrer">
                Open {platform.name}
                <ArrowUpRight aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>

        <p className="performance-platforms-footer">
          One D2D system / Clearer ownership / Better day-to-day control
        </p>
      </div>
    </section>
  );
}
