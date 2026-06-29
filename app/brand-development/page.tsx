import {
  ArrowRight,
  Layers3,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { BrandDiscoveryForm } from "@/components/brand-discovery-form";
import { ButtonLink } from "@/components/button-link";
import { CTASection } from "@/components/cta-section";
import { FeatureCard } from "@/components/feature-card";
import { ProcessStep } from "@/components/process-step";
import { SectionShell } from "@/components/section-shell";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title: "Brand Development",
  description:
    "A premium guided brand discovery experience for owners, founders, and leadership teams who need clarity before they invest in logos, websites, marketing, and sales.",
  path: "/brand-development",
});

export default function BrandDevelopmentPage() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-6 pt-14 lg:px-8 lg:pt-18">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2.4rem] border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] md:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[var(--color-accent)]">
              Brand Development
            </p>
            <h1 className="mt-6 max-w-4xl text-balance text-5xl font-semibold tracking-[-0.06em] text-[var(--color-ink)] md:text-7xl">
              Build the Brand Before You Market It.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-muted)] md:text-xl">
              A guided discovery experience for owners, founders, and
              leadership teams who need clarity before they invest in logos,
              websites, marketing, and sales.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <ButtonLink href="#brand-discovery">
                <span className="inline-flex items-center gap-2">
                  Start Brand Discovery
                  <ArrowRight className="h-4 w-4" />
                </span>
              </ButtonLink>
              <ButtonLink href="/contact" variant="secondary">
                Talk With D2D
              </ButtonLink>
            </div>
            <div className="mt-8 inline-flex flex-wrap items-center gap-3 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-4 py-3 text-sm text-[var(--color-muted)]">
              <ShieldCheck className="h-4 w-4 text-[var(--color-accent)]" />
              <span>Strategy-first. Practical. Built for execution.</span>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2">
              <article className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
                <div className="photo-placeholder photo-placeholder-one flex min-h-72 items-end p-6">
                  <div className="rounded-[1.5rem] bg-[color:color-mix(in_oklab,var(--color-card)_90%,transparent)] p-4 backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                      Discovery Session
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">
                      Professional photography direction placeholder for owner strategy sessions.
                    </p>
                  </div>
                </div>
              </article>
              <article className="overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
                <div className="photo-placeholder photo-placeholder-two flex min-h-72 items-end p-6">
                  <div className="rounded-[1.5rem] bg-[color:color-mix(in_oklab,var(--color-card)_90%,transparent)] p-4 backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
                      Brand Workspace
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-ink)]">
                      Editorial placeholder for planning boards, sketches, and strategic workshops.
                    </p>
                  </div>
                </div>
              </article>
            </div>

            <div className="rounded-[2rem] bg-[var(--color-ink)] p-8 text-white shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-sand)]">
                Brand Development Is Not Design First
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">
                Clarity before creative.
              </h2>
              <p className="mt-4 text-base leading-8 text-white/76">
                D2D turns scattered ideas into a usable brand blueprint. That
                means positioning, audience, story, voice, customer experience,
                website direction, and marketing priorities before visual design
                gets asked to carry too much weight.
              </p>
            </div>
          </div>
        </div>
      </section>

      <SectionShell
        eyebrow="What This Is"
        title="A guided brand development process, not a survey."
        description="This experience is designed to help new businesses uncover who they are, what they stand for, and how they should show up before expensive creative work begins."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <FeatureCard
            icon={SearchCheck}
            title="Discover the business"
            description="Clarify the company, founder story, audience, goals, and market reality so the brand is grounded in the truth of the business."
          />
          <FeatureCard
            icon={Target}
            title="Define the brand"
            description="Shape positioning, voice, values, customer experience, and the practical differences customers should care about."
          />
          <FeatureCard
            icon={Layers3}
            title="Build the system"
            description="Translate strategy into an actionable blueprint for logos, website decisions, marketing, sales messaging, and future growth."
          />
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Why It Matters"
        title="Most businesses jump to logos and websites too early."
        description="That often creates a polished surface on top of fuzzy positioning. D2D starts underneath the surface so every creative decision has a stronger reason behind it."
      >
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-8">
            <p className="text-lg leading-8 text-[var(--color-muted)]">
              Before the logo, there should be a clear audience. Before the
              website, there should be a story. Before the marketing plan,
              there should be positioning, tone, promise, and a more confident
              customer experience.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Positioning before promotion",
              "Audience before aesthetics",
              "Story before social content",
              "Voice before website copy",
              "Experience before ad spend",
              "Direction before design rounds",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-panel)] px-5 py-5 text-base font-medium text-[var(--color-ink)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Interactive Discovery Preview"
        title="A guided interview designed to feel effortless."
        description="The platform keeps the process calm, structured, and simple. It is designed to finish in about 15 to 20 minutes, with clear progress, autosave, and private submission built in."
      >
        <div className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
          <div className="space-y-4">
            {[
              "One guided section at a time, with large readable inputs and calm pacing.",
              "Progress, autosave, and resume-later behavior without extra clutter.",
              "Private submission that keeps the strategy work on the D2D side.",
              "A clean review step before anything gets submitted.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-5 text-base leading-7 text-[var(--color-muted)]"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-accent)]">
                  Live Preview
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--color-ink)]">
                  Brand Discovery Platform
                </h3>
              </div>
              <div className="rounded-full bg-[var(--color-panel)] px-4 py-2 text-sm text-[var(--color-muted)]">
                12-15 min
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-[var(--color-panel)] p-5">
              <div className="flex items-center justify-between text-sm text-[var(--color-muted)]">
                <span>Step 05 of 11</span>
                <span>Positioning</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-[var(--color-border-soft)]">
                <div className="h-2 w-[46%] rounded-full bg-[var(--color-accent)]" />
              </div>
              <div className="mt-5 grid gap-4">
                <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    What makes your company meaningfully different?
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
                    Explain the real difference customers should care about.
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    Here&apos;s what we&apos;ve learned so far...
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--color-muted)]">
                    <li>Premium custom builder with a craftsmanship-first reputation</li>
                    <li>Targets affluent homeowners seeking confidence and transparency</li>
                    <li>Wants a stronger, more timeless public presence</li>
                  </ul>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-card)] px-3 py-2 text-xs font-medium text-[var(--color-muted)]">
                  <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                  Private + autosaved
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Save & Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Brand Process"
        title="Brand strategy that becomes practical execution."
        description="The flow is designed to uncover the business, shape the brand, and turn that clarity into systems a company can actually use."
      >
        <div className="grid gap-5 xl:grid-cols-4">
          <ProcessStep
            index={1}
            title="Uncover"
            description="Capture founder intent, business reality, and the current customer experience."
          />
          <ProcessStep
            index={2}
            title="Clarify"
            description="Define positioning, voice, audience, story, and the strategic difference behind the brand."
          />
          <ProcessStep
            index={3}
            title="Translate"
            description="Convert answers into a practical brand blueprint, website direction, and messaging system."
          />
          <ProcessStep
            index={4}
            title="Activate"
            description="Use the blueprint to guide design, marketing, sales, and longer-term growth decisions."
          />
        </div>
      </SectionShell>

      <BrandDiscoveryForm />

      <CTASection
        title="Ready to build the brand behind the business?"
        description="Start the guided discovery and build a clearer story, sharper position, and more useful brand system."
        primaryHref="#brand-discovery"
        primaryLabel="Start Brand Discovery"
        secondaryHref="/contact"
        secondaryLabel="Talk With D2D"
      />
    </>
  );
}
