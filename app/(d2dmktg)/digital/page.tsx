import {
  ArrowDown,
  ArrowRight,
  Blocks,
  Braces,
  Code2,
  Gauge,
  Layers3,
  Megaphone,
  MonitorSmartphone,
  PanelsTopLeft,
  Workflow,
} from "lucide-react";
import type { Metadata } from "next";
import "./digital.css";

const marketingUrl = "/";
const performanceUrl = "/performance#top";
const digitalContactUrl = "/#contact";

export const metadata: Metadata = {
  title: {
    absolute: "D2D Digital | Websites, Tools & Digital Systems",
  },
  description:
    "D2D Digital builds focused websites, useful digital tools, and connected systems that make good businesses easier to find, use, and grow.",
};

const capabilities = [
  {
    number: "01",
    icon: MonitorSmartphone,
    title: "Websites",
    copy: "Clear, responsive websites shaped around how real customers search, decide, and take action.",
    tags: ["Strategy", "UX", "Development"],
  },
  {
    number: "02",
    icon: Blocks,
    title: "Digital tools",
    copy: "Focused calculators, diagnostics, forms, portals, and resources that turn expertise into something people can use.",
    tags: ["Product thinking", "Automation", "Utility"],
  },
  {
    number: "03",
    icon: Workflow,
    title: "Connected systems",
    copy: "Practical workflows that reduce duplicate work and connect the public experience to the team behind it.",
    tags: ["Integrations", "CMS", "Operations"],
  },
  {
    number: "04",
    icon: Gauge,
    title: "Optimization",
    copy: "Ongoing refinement across performance, accessibility, content structure, and conversion paths.",
    tags: ["Speed", "Accessibility", "Iteration"],
  },
] as const;

const buildPrinciples = [
  {
    title: "Useful before flashy",
    copy: "The experience starts with the job it needs to do. Visual polish supports that job instead of getting in its way.",
  },
  {
    title: "Clear before complex",
    copy: "Strong hierarchy, focused language, and sensible paths help people find what they need without a learning curve.",
  },
  {
    title: "Built to keep working",
    copy: "Responsive layouts, accessible interaction, and maintainable systems make the work more durable after launch.",
  },
] as const;

function Arrow() {
  return <ArrowRight aria-hidden="true" size={16} strokeWidth={1.7} />;
}

export default function Home() {
  return (
    <div className="digital-site">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <nav className="ecosystem-nav" aria-label="D2D companies">
        <div className="ecosystem-inner">
          <span className="ecosystem-label">The D2D system</span>
          <div className="ecosystem-links">
            <a href={marketingUrl}>
              <Megaphone aria-hidden="true" />
              <strong>D2D Marketing</strong>
              <small>Clarify + connect</small>
            </a>
            <a className="is-current" href="#top" aria-current="page">
              <Code2 aria-hidden="true" />
              <strong>D2D Digital</strong>
              <small>Build + integrate</small>
            </a>
            <a href={performanceUrl}>
              <Gauge aria-hidden="true" />
              <strong>D2D Performance</strong>
              <small>Lead + improve</small>
            </a>
          </div>
        </div>
      </nav>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="D2D Digital home">
          <span className="brand-parent">DAY2DAY</span>
          <span className="brand-name">D2D DIGITAL<span aria-hidden="true">_</span></span>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="#capabilities">Capabilities</a>
          <a href="#approach">Approach</a>
          <a href="#systems">Systems</a>
        </nav>

        <a className="header-cta" href={digitalContactUrl}>
          Plan a digital build <Arrow />
        </a>

        <details className="mobile-nav">
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">
            <a href="#capabilities">Capabilities</a>
            <a href="#approach">Approach</a>
            <a href="#systems">Systems</a>
            <a href={marketingUrl}>D2D Marketing / Main</a>
            <a href={performanceUrl}>D2D Performance</a>
            <a href={digitalContactUrl}>Plan a digital build</a>
          </nav>
        </details>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="status-dot" />
              Digital systems built for the DAY2DAY
            </p>
            <h1>
              Make your digital presence
              <span>work harder.</span>
            </h1>
            <p className="hero-lede">
              D2D Digital creates focused websites, useful digital tools, and
              connected systems that make good businesses easier to find,
              understand, and use.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href={digitalContactUrl}>
                Build something useful <Arrow />
              </a>
              <a className="text-link" href="#capabilities">
                Explore capabilities <ArrowDown aria-hidden="true" size={16} />
              </a>
            </div>
          </div>

          <div className="system-window" aria-label="D2D Digital capability system">
            <div className="window-bar">
              <div className="window-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <span>d2d.system / capabilities</span>
              <span className="window-live">live</span>
            </div>
            <div className="window-body">
              <div className="command-line">
                <span>&gt;</span>
                <p>build --for=&quot;real people&quot; --goal=&quot;useful&quot;</p>
              </div>
              <div className="system-readout">
                <div className="readout-ring">
                  <span>4</span>
                  <small>layers</small>
                </div>
                <div className="readout-list">
                  {["Strategy", "Experience", "Technology", "Iteration"].map(
                    (item, index) => (
                      <div key={item}>
                        <span>0{index + 1}</span>
                        <p>{item}</p>
                        <i aria-hidden="true" />
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div className="system-footer">
                <span>STATUS: READY TO BUILD</span>
                <span>DFW / 32.7767° N</span>
              </div>
            </div>
          </div>

          <p className="hero-index">D2D / DIGITAL / 2026</p>
        </section>

        <section className="ecosystem-position">
          <div className="ecosystem-position-heading">
            <p className="eyebrow">Where Digital fits</p>
            <h2>The build stage of a connected business journey.</h2>
            <p>
              D2D Digital is its own specialist practice, but it works best
              when the business has a clear story to express and a clear
              operating goal to support.
            </p>
          </div>

          <div className="ecosystem-stages">
            <a href={marketingUrl}>
              <div className="stage-top">
                <span>Start here</span>
              </div>
              <h3>D2D Marketing</h3>
              <p>
                Clarify the brand, sharpen the message, and create the marketing
                rhythm that connects the business to the right people.
              </p>
              <small>Brand strategy · Messaging · Campaigns · Content</small>
              <strong>Explore the main practice <Arrow /></strong>
            </a>
            <article className="is-current">
              <div className="stage-top">
                <span>Build it</span>
                <em>Current</em>
              </div>
              <h3>D2D Digital</h3>
              <p>
                Turn the strategy into a website, useful digital tool,
                connected workflow, or platform people can actually use.
              </p>
              <small>Websites · Tools · Portals · Integrations</small>
              <strong>Build what matters</strong>
            </article>
            <a href={performanceUrl}>
              <div className="stage-top">
                <span>Improve it</span>
              </div>
              <h3>D2D Performance</h3>
              <p>
                Align leadership, establish an operating cadence, and improve
                the systems that turn strategy into repeatable execution.
              </p>
              <small>Strategy · Leadership · Systems · Optimization</small>
              <strong>Continue to D2D Performance <Arrow /></strong>
            </a>
          </div>
        </section>

        <section className="capabilities section" id="capabilities">
          <div className="section-intro">
            <p className="eyebrow dark">What we build</p>
            <h2>Digital work should do something.</h2>
            <p>
              Every engagement connects the brand people see to the experience
              they actually use—then makes that experience easier to manage and
              improve.
            </p>
          </div>

          <div className="capability-grid">
            {capabilities.map((capability) => {
              const Icon = capability.icon;

              return (
                <article key={capability.title} className="capability-card">
                  <div className="card-top">
                    <span>{capability.number}</span>
                    <Icon aria-hidden="true" size={24} strokeWidth={1.35} />
                  </div>
                  <h3>{capability.title}</h3>
                  <p>{capability.copy}</p>
                  <div className="tag-row">
                    {capability.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="approach" id="approach">
          <div className="approach-heading">
            <p className="eyebrow">How D2D thinks</p>
            <h2>
              Strategy in front.
              <span>Technology in service.</span>
            </h2>
          </div>
          <div className="principles">
            {buildPrinciples.map((principle, index) => (
              <article key={principle.title}>
                <span>0{index + 1}</span>
                <div>
                  <h3>{principle.title}</h3>
                  <p>{principle.copy}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="systems section" id="systems">
          <div className="systems-board">
            <div className="systems-copy">
              <p className="eyebrow dark">One connected practice</p>
              <h2>From page to platform.</h2>
              <p>
                The right solution might be a focused landing page, a complete
                website, a guided discovery, a client portal, or the system
                connecting all of them. We choose the smallest useful solution,
                then build it to grow.
              </p>
              <a className="text-link dark-link" href={digitalContactUrl}>
                Plan the right digital build <Arrow />
              </a>
            </div>
            <div className="architecture" aria-label="Connected digital system">
              <div className="architecture-center">
                <Braces aria-hidden="true" size={28} />
                <span>D2D</span>
                <small>core</small>
              </div>
              <div className="architecture-node node-one">
                <PanelsTopLeft aria-hidden="true" size={18} />
                <span>Website</span>
              </div>
              <div className="architecture-node node-two">
                <Layers3 aria-hidden="true" size={18} />
                <span>Content</span>
              </div>
              <div className="architecture-node node-three">
                <Workflow aria-hidden="true" size={18} />
                <span>Workflow</span>
              </div>
              <div className="architecture-node node-four">
                <Gauge aria-hidden="true" size={18} />
                <span>Optimize</span>
              </div>
            </div>
          </div>
        </section>

        <section className="cta">
          <p className="eyebrow">Next build</p>
          <h2>Have a digital idea that needs to become real?</h2>
          <p>
            Bring the problem, the opportunity, or the rough sketch. We&apos;ll
            help shape the right experience around it.
          </p>
          <a className="button button-light" href={digitalContactUrl}>
            Start a digital conversation <Arrow />
          </a>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div>
            <p className="brand-parent">DAY2DAY</p>
            <p className="footer-logo">D2D DIGITAL<span aria-hidden="true">_</span></p>
            <p className="footer-statement">
              Websites, tools, and systems built to support the work that
              happens DAY2DAY.
            </p>
          </div>
          <div>
            <h2>Explore</h2>
            <a href="#capabilities">Capabilities</a>
            <a href="#approach">Approach</a>
            <a href="#systems">Systems</a>
          </div>
          <div>
            <h2>D2D system</h2>
            <a href={marketingUrl}>D2D Marketing / Main <Arrow /></a>
            <a href="#top" aria-current="page">D2D Digital / Build</a>
            <a href={performanceUrl}>D2D Performance / Improve <Arrow /></a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} D2D Digital.</span>
          <span>Designed and built for the DAY2DAY.</span>
        </div>
      </footer>
    </div>
  );
}
