import { ArrowDown, ArrowRight, Crosshair, Gauge, TimerReset } from "lucide-react";
import { ButtonLink } from "@/components/button-link";

export function HomeHero() {
  const performanceLanes = [
    {
      label: "Revenue",
      note: "Find the levers",
      progress: "84%",
    },
    {
      label: "Customers",
      note: "See the signals",
      progress: "72%",
    },
    {
      label: "Systems",
      note: "Connect the work",
      progress: "91%",
    },
    {
      label: "Execution",
      note: "Improve objectively",
      progress: "78%",
    },
  ] as const;

  return (
    <section className="performance-hero" id="top">
      <div className="performance-field" aria-hidden="true" />
      <div className="performance-hero-inner">
        <div className="performance-hero-copy">
          <p className="performance-kicker">
            <span />
            Revenue · Information · Decisions
          </p>
          <h1>
            Turn business information into
            <span>better operating decisions.</span>
          </h1>
          <p className="performance-lede">
            D2D Performance helps leaders improve revenue and operations with
            connected information systems, decision-ready dashboards, objective
            analysis, and technology that supports how the business actually works.
          </p>
          <div className="performance-actions">
            <ButtonLink href="#performance-framework">
              <span className="inline-flex items-center gap-2">
                Build the operating picture
                <ArrowRight className="h-4 w-4" />
              </span>
            </ButtonLink>
            <a className="performance-text-link" href="#analysis">
              Explore the analysis tools
              <ArrowDown aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
          <div className="performance-principles" aria-label="D2D Performance approach">
            <span><Crosshair aria-hidden="true" /> Objective baseline</span>
            <span><TimerReset aria-hidden="true" /> Operating cadence</span>
            <span><Gauge aria-hidden="true" /> Measured improvement</span>
          </div>
        </div>

        <div className="performance-board" aria-label="Performance framework">
          <div className="performance-board-top">
            <div>
              <p>D2D / PERFORMANCE SYSTEM</p>
              <span>Business information framework</span>
            </div>
            <strong>ACTIVE</strong>
          </div>
          <div className="performance-score">
            <div>
              <span>THE</span>
              <strong>DAY2DAY</strong>
              <small>is where performance compounds.</small>
            </div>
            <div className="performance-cycle">
              <span>Baseline</span>
              <i aria-hidden="true" />
              <span>Build</span>
              <i aria-hidden="true" />
              <span>Optimize</span>
            </div>
          </div>
          <div className="performance-lanes">
            {performanceLanes.map((lane, index) => (
              <div key={lane.label}>
                <span>0{index + 1}</span>
                <div>
                  <strong>{lane.label}</strong>
                  <small>{lane.note}</small>
                </div>
                <i aria-hidden="true">
                  <b style={{ width: lane.progress }} />
                </i>
              </div>
            ))}
          </div>
          <div className="performance-board-bottom">
            <span>ASSESS</span>
            <span>ALIGN</span>
            <span>ACT</span>
            <span>ADJUST</span>
          </div>
        </div>
      </div>
      <p className="performance-side-note">Clarity for the decisions that move the business</p>
    </section>
  );
}
