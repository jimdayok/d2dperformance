import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { BadgeCheck, Focus, Zap } from "lucide-react";
import type { CSSProperties } from "react";
import "./d2dmktg.css";
import {
  InstagramFeed,
  ServiceAccordion,
  WorkGallery,
} from "@/components/d2dmktg/interactions";
import { D2DJourney, SiteHeader } from "@/components/d2dmktg/site-chrome";
import { siteConfig } from "@/lib/d2dmktg/site-config";

export const metadata: Metadata = {
  title: {
    absolute: "DAY2DAY Marketing | Brand Strategy & Marketing Support",
  },
  description:
    "Senior-level brand strategy and hands-on marketing support for established businesses ready to make their business a brand.",
  openGraph: {
    title: "DAY2DAY Marketing",
    description: "Branding lives in the DAY2DAY.",
    images: ["/d2dmktg-og.png"],
  },
};

const services = [
  {
    title: "Creative",
    description:
      "Integrate your brand design into strategic communications that capture your audience and invite them to take action.",
  },
  {
    title: "Strategy & Planning",
    description:
      "Build a marketing plan that communicates confidence, precision, and power—internally and externally.",
  },
  {
    title: "Funnel Marketing",
    description:
      "Guide the customer journey from awareness to purchase with a clear, intentional conversation.",
  },
  {
    title: "Social Media Management",
    description:
      "Maintain a human dialogue with your followers through a practical, consistent campaign calendar.",
  },
  {
    title: "Content Marketing",
    description:
      "Tell your brand story with campaign content designed to speak directly to your audience.",
  },
  {
    title: "Digital Marketing",
    description:
      "Connect precise messages to your ideal audience with thoughtful, measurable digital execution.",
  },
];

const strengths = [
  {
    icon: Focus,
    title: "Branding that creates clarity",
    copy: "When customers don’t quickly understand what you do, they don’t convert. DAY2DAY helps clarify your positioning and shape how your ideal customer sees you.",
  },
  {
    icon: BadgeCheck,
    title: "Senior-level support",
    copy: "Get experienced strategic direction in a flexible, hands-on partnership—without the overhead of a full-scale agency.",
  },
  {
    icon: Zap,
    title: "Speed to market",
    copy: "Practical workflows and content tools help move campaigns, materials, and messaging from idea to market with less friction.",
  },
];

const work = [
  {
    name: "IMA Foodservice",
    image: "/assets/original/ima-foodservice.jpg",
    alt: "IMA Foodservice campaign work by DAY2DAY Marketing",
    href: "https://imafoodservice.com",
    embeddable: true,
    services: "Point of sale · Product guides · Digital content",
  },
  {
    name: "Elite Companies",
    image: "/assets/original/elite-companies.jpg",
    alt: "Elite Companies brand work by DAY2DAY Marketing",
    href: "https://www.elite-companies.com",
    services: "Rebrand · Website · Copywriting · Events",
  },
  {
    name: "Jilly Bean Photography",
    image: "/assets/original/jilly-bean-photography.jpg",
    alt: "Jilly Bean Photography marketing work by DAY2DAY Marketing",
    href: "https://www.jillybeanphotography.com",
    services: "Brand clarity · Campaign support · Digital presence",
  },
];

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export default function Home() {
  return (
    <div className="d2dmktg-site">
      <SiteHeader />

      <main id="main">
        <section className="hero scroll-scene" id="top" data-scroll-scene>
          <Image
            className="hero-image"
            src="/assets/original/hero-branding-lives-day2day.jpg"
            alt=""
            fill
            sizes="100vw"
            priority
            unoptimized
          />
          <div className="hero-shade" />
          <div className="hero-transition" aria-hidden="true" />
          <div className="hero-content" data-reveal>
            <p className="eyebrow">Brand strategy + hands-on marketing support</p>
            <h1>
              Branding lives in
              <span>the DAY2DAY.</span>
            </h1>
            <p className="hero-lede">
              Clear direction, practical brand systems, and experienced support
              for established businesses ready to make their business a brand.
            </p>
            <div className="button-row">
              <a
                className="button button-light"
                href={siteConfig.links.calendly}
                target="_blank"
                rel="noreferrer"
              >
                Schedule a consultation <Arrow />
              </a>
              <a className="text-link light" href="#services">
                Explore services <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <p className="hero-side-note">Dallas–Fort Worth · Working DAY2DAY</p>
        </section>

        <section
          className="intro section scroll-scene"
          id="why-d2d"
          data-scroll-scene
        >
          <div className="section-label" data-reveal>
            <span>Why DAY2DAY</span>
            <div className="intro-brand-graphic" aria-hidden="true">
              <Image
                src="/assets/original/day2day-stamp-white.png"
                alt=""
                width={362}
                height={363}
                unoptimized
              />
            </div>
          </div>
          <div
            className="intro-copy"
            data-reveal
            style={{ "--reveal-delay": "80ms" } as CSSProperties}
          >
            <h2>Built to support the DAY2DAY.</h2>
            <p>
              Not every business needs a full-scale agency, and not every
              business wants to do it alone. DAY2DAY Marketing offers
              senior-level brand strategy in a more flexible, hands-on way,
              giving you clear direction, faster decisions, and branding
              systems designed for real-world use.
            </p>
            <a className="text-link" href="mailto:andrea@d2dmktg.com">
              Start a conversation <Arrow />
            </a>
          </div>
        </section>

        <section
          className="strengths section scroll-scene"
          aria-label="How DAY2DAY helps"
          data-scroll-scene
        >
          {strengths.map((strength, index) => {
            const StrengthIcon = strength.icon;
            return (
              <article
                className="strength"
                key={strength.title}
                data-reveal
                style={
                  { "--reveal-delay": `${index * 90}ms` } as CSSProperties
                }
              >
                <span className="strength-icon" aria-hidden="true">
                  <StrengthIcon strokeWidth={1.25} />
                </span>
                <h3>{strength.title}</h3>
                <p>{strength.copy}</p>
              </article>
            );
          })}
        </section>

        <D2DJourney />

        <section className="brand-foundation scroll-scene" data-scroll-scene>
          <div
            className="foundation-visual"
            data-reveal
            role="img"
            aria-label="DAY2DAY brand strategy system"
          >
            <div className="foundation-orbit foundation-orbit-one" />
            <div className="foundation-orbit foundation-orbit-two" />
            <div className="foundation-board">
              <div className="foundation-board-topline">
                <span>Brand system</span>
                <span>DAY2DAY / 01</span>
              </div>
              <Image
                className="foundation-mark"
                src="/assets/original/day2day-icon-reverse.png"
                alt=""
                width={470}
                height={271}
                unoptimized
              />
              <div className="foundation-statement" aria-hidden="true">
                <span>Clear brands</span>
                <em>move</em>
                <span>people.</span>
              </div>
              <div className="foundation-pillars" aria-hidden="true">
                <span>Purpose</span>
                <span>Promise</span>
                <span>Proof</span>
              </div>
              <div className="foundation-palette" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>
            <p className="foundation-visual-note" aria-hidden="true">
              Strategy · Story · Systems
            </p>
          </div>
          <div className="foundation-copy" data-reveal>
            <p className="eyebrow dark">Brand development</p>
            <h2>Build brand awareness before you market it.</h2>
            <p>
              Marketing works best when it’s built on a clear brand system.
              DAY2DAY starts with structure, defining the foundation before
              anything goes to market.
            </p>
            <ul aria-label="Brand development capabilities">
              <li>Brand nomenclature</li>
              <li>Brand story</li>
              <li>Logo system</li>
              <li>Brand guidelines</li>
              <li>Digital presence</li>
            </ul>
            <a
              className="button button-dark"
              href={siteConfig.links.brandDevelopment}
              target="_blank"
              rel="noreferrer"
            >
              Explore brand development <Arrow />
            </a>
          </div>
        </section>

        <section
          className="services section scroll-scene"
          id="services"
          data-scroll-scene
        >
          <div className="services-heading" data-reveal>
            <div>
              <p className="eyebrow dark">What we do</p>
              <h2>Dream big. Execute bigger.</h2>
            </div>
            <p>
              Strategic activities and practical tactics that help build brands
              into businesses.
            </p>
          </div>
          <ServiceAccordion services={services} />
        </section>

        <section
          className="work section scroll-scene"
          id="work"
          data-scroll-scene
        >
          <div className="work-heading" data-reveal>
            <div>
              <p className="eyebrow dark">Better together</p>
              <h2>Our clients are true partners.</h2>
            </div>
            <p>
              We build relationships first and grow business second—aligning
              with each client’s vision before the work begins.
            </p>
          </div>
          <WorkGallery work={work} />
        </section>

        <section
          className="instagram section scroll-scene"
          aria-labelledby="instagram-heading"
          data-scroll-scene
        >
          <div className="instagram-heading" data-reveal>
            <div>
              <p className="eyebrow dark">From Instagram</p>
              <h2 id="instagram-heading">See what’s happening across the network.</h2>
            </div>
            <div>
              <p>
                DAY2DAY Marketing and the brands we support—one connected look
                at ideas, client work, and momentum in market.
              </p>
              <a
                className="text-link"
                href={siteConfig.links.instagram}
                target="_blank"
                rel="noreferrer"
              >
                Follow @day2daymarketing <Arrow />
              </a>
            </div>
          </div>
          <InstagramFeed />
        </section>

        <section
          className="contact scroll-scene"
          id="contact"
          data-scroll-scene
        >
          <div className="contact-stamp" aria-hidden="true">
            <Image
              src="/assets/original/day2day-stamp-white.png"
              alt=""
              width={362}
              height={363}
              unoptimized
            />
          </div>
          <div className="contact-content" data-reveal>
            <p className="eyebrow">Ready when you are</p>
            <h2>Let’s get your next idea into the DAY2DAY.</h2>
            <p>
              Tell Andrea what you’re building, where marketing feels stuck, or
              what needs to move faster.
            </p>
            <div className="button-row">
              <a
                className="button button-light"
                href={siteConfig.links.calendly}
                target="_blank"
                rel="noreferrer"
              >
                Book a consultation <Arrow />
              </a>
              <a className="text-link light" href={`mailto:${siteConfig.email}`}>
                Email Andrea <Arrow />
              </a>
            </div>
          </div>
        </section>
      </main>

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
            <Link href="/#why-d2d">Why D2D</Link>
            <Link href="/#services">Services</Link>
            <a href="https://d2dmktg-proposal.vercel.app/field-notes">
              Field Notes
            </a>
            <Link href="/#work">Better Together</Link>
            <Link href="/#contact">Contact</Link>
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
            <a
              href={siteConfig.links.instagram}
              target="_blank"
              rel="noreferrer"
            >
              Instagram <Arrow />
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
    </div>
  );
}
