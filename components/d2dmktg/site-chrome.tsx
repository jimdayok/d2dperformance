import Image from "next/image";
import Link from "next/link";
import { Code2, Gauge, Megaphone, Menu } from "lucide-react";
import type { ReactNode } from "react";
import { MotionController } from "@/components/d2dmktg/interactions";
import { MobileScrollHeader } from "@/components/mobile-scroll-header";
import { siteConfig } from "@/lib/d2dmktg/site-config";

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

const navigation = [
  { href: "/#why-d2d", label: "Why D2D" },
  { href: "/#services", label: "Services" },
  {
    href: "https://d2dmktg-proposal.vercel.app/field-notes",
    label: "Field Notes",
  },
  { href: "/#work", label: "Better Together" },
  { href: "/#contact", label: "Contact" },
] as const;

const d2dEcosystem = [
  {
    name: "D2D Marketing",
    role: "Clarify + connect",
    href: "/",
    current: true,
    icon: Megaphone,
  },
  {
    name: "D2D Digital",
    role: "Build + integrate",
    href: siteConfig.links.d2dDigital,
    current: false,
    icon: Code2,
  },
  {
    name: "D2D Performance",
    role: "Lead + improve",
    href: siteConfig.links.d2dPerformance,
    current: false,
    icon: Gauge,
  },
] as const;

export function D2DEcosystemNav() {
  return (
    <nav className="d2d-ecosystem-nav" aria-label="D2D companies">
      <div className="d2d-ecosystem-inner">
        <span className="d2d-ecosystem-label">The D2D system</span>
        <div className="d2d-ecosystem-links">
          {d2dEcosystem.map((item) => {
            const Icon = item.icon;

            return item.current ? (
              <Link
                className="is-current"
                href={item.href}
                key={item.name}
                aria-current="page"
              >
                <Icon aria-hidden="true" />
                <strong>{item.name}</strong>
                <small>{item.role}</small>
              </Link>
            ) : (
              <a href={item.href} key={item.name}>
                <Icon aria-hidden="true" />
                <strong>{item.name}</strong>
                <small>{item.role}</small>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function SiteHeader() {
  return (
    <>
      <MotionController />
      <MobileScrollHeader
        breakpoint={980}
        ecosystemSelector=".d2d-ecosystem-nav"
        headerSelector=".site-header"
        menuSelector=".mobile-nav"
      />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <D2DEcosystemNav />
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label="DAY2DAY Marketing home">
            <Image
              src="/assets/original/day2day-marketing-reverse.png"
              alt="DAY2DAY Marketing"
              width={982}
              height={283}
              priority
              unoptimized
            />
          </Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
            {navigation.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <details className="client-menu">
            <summary>
              Client Login <Arrow />
            </summary>
            <div className="client-menu-panel">
              <a
                href={siteConfig.links.brandVault}
                target="_blank"
                rel="noreferrer"
              >
                <span>Brand Site Portal</span>
                <small>Brand Assets &amp; Guidelines</small>
              </a>
              <a
                href={siteConfig.links.websiteEditing}
                target="_blank"
                rel="noreferrer"
              >
                <span>Website Management Portal</span>
                <small>Site Manager / Content Operations</small>
              </a>
            </div>
          </details>

          <details className="mobile-nav">
            <summary aria-label="Open navigation">
              <Menu aria-hidden="true" />
              <span>Menu</span>
            </summary>
            <nav aria-label="Mobile navigation">
              {navigation.map((item) => (
                <Link href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
              <span className="mobile-login-label">The D2D System</span>
              <Link href="/">D2D Marketing / Main</Link>
              <Link href={siteConfig.links.d2dDigital}>D2D Digital</Link>
              <Link href={siteConfig.links.d2dPerformance}>
                D2D Performance
              </Link>
              <span className="mobile-login-label">Client Login</span>
              <a
                href={siteConfig.links.brandVault}
                target="_blank"
                rel="noreferrer"
              >
                Brand Site Portal <Arrow />
              </a>
              <a
                href={siteConfig.links.websiteEditing}
                target="_blank"
                rel="noreferrer"
              >
                Website Management Portal <Arrow />
              </a>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}

export function D2DJourney() {
  return (
    <section className="d2d-journey scroll-scene" data-scroll-scene>
      <div className="d2d-journey-heading" data-reveal>
        <p className="eyebrow dark">One connected D2D system</p>
        <h2>Start with clarity. Build what matters. Improve it DAY2DAY.</h2>
        <p>
          Each D2D company solves a different part of the same business
          challenge. D2D Marketing is the main starting point, then Digital and
          Performance extend the work when the next problem becomes clear.
        </p>
      </div>

      <div className="d2d-journey-grid">
        <article className="d2d-journey-card is-current" data-reveal>
          <div className="d2d-journey-card-top">
            <span>Start here</span>
            <strong>Current</strong>
          </div>
          <h3>D2D Marketing</h3>
          <p>
            Clarify the brand, sharpen the message, and create the marketing
            rhythm that connects the business to the right people.
          </p>
          <small>Brand strategy · Messaging · Campaigns · Content</small>
          <Link href="/#services">
            Explore the main practice <Arrow />
          </Link>
        </article>

        <article className="d2d-journey-card" data-reveal>
          <div className="d2d-journey-card-top">
            <span>Build it</span>
          </div>
          <h3>D2D Digital</h3>
          <p>
            Turn the strategy into a website, useful digital tool, connected
            workflow, or platform people can actually use.
          </p>
          <small>Websites · Tools · Portals · Integrations</small>
          <a href={siteConfig.links.d2dDigital}>
            Continue to D2D Digital <Arrow />
          </a>
        </article>

        <article className="d2d-journey-card" data-reveal>
          <div className="d2d-journey-card-top">
            <span>Improve it</span>
          </div>
          <h3>D2D Performance</h3>
          <p>
            Align leadership, establish an operating cadence, and improve the
            systems that turn strategy into repeatable execution.
          </p>
          <small>Strategy · Leadership · Systems · Optimization</small>
          <a href={siteConfig.links.d2dPerformance}>
            Continue to D2D Performance <Arrow />
          </a>
        </article>
      </div>
    </section>
  );
}

export function PageHero({
  eyebrow,
  title,
  copy,
  image,
  imageAlt = "",
  action,
  variant,
}: {
  eyebrow: string;
  title: ReactNode;
  copy: string;
  image: string;
  imageAlt?: string;
  action?: ReactNode;
  variant?: "portrait";
}) {
  return (
    <section
      className={`subpage-hero${variant ? ` subpage-hero-${variant}` : ""}`}
    >
      <Image
        className="subpage-hero-image"
        src={image}
        alt={imageAlt}
        fill
        sizes="100vw"
        priority
        unoptimized
      />
      <div className="subpage-hero-shade" />
      <div className="subpage-hero-content" data-reveal>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{copy}</p>
        {action}
      </div>
      <div className="subpage-hero-index" aria-hidden="true">
        <span>DAY2DAY</span>
        <span>Brand / Marketing / Momentum</span>
      </div>
    </section>
  );
}

export function PageCta({
  eyebrow = "Ready when you are",
  title,
  copy,
  actionLabel = "Start a conversation",
  actionHref = "/contact",
}: {
  eyebrow?: string;
  title: string;
  copy: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <section className="page-cta">
      <div className="page-cta-mark" aria-hidden="true">
        <Image
          src="/assets/original/day2day-stamp-white.png"
          alt=""
          width={362}
          height={363}
          unoptimized
        />
      </div>
      <div data-reveal>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{copy}</p>
        <div className="button-row">
          <Link className="button button-light" href={actionHref}>
            {actionLabel} <Arrow />
          </Link>
          <a
            className="text-link light"
            href={siteConfig.links.calendly}
            target="_blank"
            rel="noreferrer"
          >
            Book a consultation <Arrow />
          </a>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Image
            src="/assets/original/day2day-marketing-reverse.png"
            alt="DAY2DAY Marketing"
            width={982}
            height={283}
            unoptimized
          />
          <p>Strategic direction for the work that happens DAY2DAY.</p>
        </div>
        <div>
          <h2>Connect</h2>
          <a href={`tel:${siteConfig.phoneHref}`}>{siteConfig.phone}</a>
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          <span>{siteConfig.location}</span>
        </div>
        <div>
          <h2>Explore</h2>
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <div>
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
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {siteConfig.businessName}. All rights
          reserved. Page designed by{" "}
          <a href={siteConfig.links.d2dDigital}>D2D Digital</a>.
        </span>
        <div>
          <a href={siteConfig.links.d2dDigital}>D2D Digital</a>
          <a href={siteConfig.links.d2dPerformance}>D2D Performance</a>
          <a
            href="https://d2dmktg.com/terms-of-use"
            target="_blank"
            rel="noreferrer"
          >
            Terms of use
          </a>
          <a
            href="https://d2dmktg.com/privacy-policy"
            target="_blank"
            rel="noreferrer"
          >
            Privacy policy
          </a>
        </div>
      </div>
    </footer>
  );
}
