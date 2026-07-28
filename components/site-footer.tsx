import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/lib/d2dmktg/site-config";

const marketingNavigation = [
  { href: "https://d2dmktg.com/why-d2d", label: "Why D2D" },
  { href: "https://d2dmktg.com/services", label: "Services" },
  { href: "https://d2dmktg.com/field-notes", label: "Field Notes" },
  { href: "https://d2dmktg.com/better-together", label: "Better Together" },
  { href: "https://d2dmktg.com/contact", label: "Contact" },
] as const;

function Arrow() {
  return <ArrowUpRight aria-hidden="true" size={14} strokeWidth={1.6} />;
}

export function SiteFooter() {
  return (
    <footer className="d2d-family-footer">
      <div className="d2d-family-footer-main">
        <div className="d2d-family-footer-brand">
          <Image
            src="/assets/original/day2day-marketing-reverse.png"
            alt="DAY2DAY Marketing"
            width={982}
            height={283}
          />
          <p>Strategic direction for the work that happens DAY2DAY.</p>
        </div>

        <div className="d2d-family-footer-column">
          <h2>Connect</h2>
          <a href={`tel:${siteConfig.phoneHref}`}>{siteConfig.phone}</a>
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          <span>{siteConfig.location}</span>
        </div>

        <div className="d2d-family-footer-column">
          <h2>Explore</h2>
          {marketingNavigation.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </div>

        <div className="d2d-family-footer-column">
          <h2>Stay in touch</h2>
          <a
            href={siteConfig.links.newsletter}
            target="_blank"
            rel="noreferrer"
          >
            Newsletter <Arrow />
          </a>
          <a href={siteConfig.links.review} target="_blank" rel="noreferrer">
            Leave a review <Arrow />
          </a>
          <a
            href={siteConfig.links.linkedin}
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn <Arrow />
          </a>
          <a
            href={siteConfig.links.instagram}
            target="_blank"
            rel="noreferrer"
          >
            Instagram <Arrow />
          </a>
        </div>
      </div>

      <div className="d2d-family-footer-bottom">
        <span>
          © {new Date().getFullYear()} DAY2DAY Marketing. All rights reserved.
          Page designed by{" "}
          <a href="https://performance.d2dmktg.com/digital">D2D Digital</a>.
        </span>
        <div>
          <Link href="/digital">D2D Digital</Link>
          <Link href="/">D2D Performance</Link>
          <a href="https://d2dmktg.com/terms-of-use">Terms of use</a>
          <a href="https://d2dmktg.com/privacy-policy">Privacy policy</a>
        </div>
      </div>
    </footer>
  );
}
