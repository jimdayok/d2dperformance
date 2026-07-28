import { ArrowDown, ArrowRight, Crosshair, Gauge, TimerReset } from "lucide-react";
import { ButtonLink } from "@/components/button-link";

export function HomeHero() {
  const performanceLanes = [
    {
      label: "Strategy",
      note: "Choose the field",
      progress: "84%",
    },
    {
      label: "Leadership",
      note: "Set the cadence",
      progress: "72%",
    },
    {
      label: "Systems",
      note: "Build repeatability",
      progress: "91%",
    },
    {
      label: "Execution",
      note: "Close the gap",
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
            Strategy · Leadership · Execution
          </p>
          <h1>
            Better businesses are
            <span>trained, not wished into being.</span>
          </h1>
          <p className="performance-lede">
            D2D Marketing helps owners and leadership teams create the
            clarity, systems, and operating rhythm required to improve on
            purpose—one decision, one rep, and one quarter at a time.
          </p>
          <div className="performance-actions">
            <ButtonLink href="#brand-discovery">
              <span className="inline-flex items-center gap-2">
                Establish your baseline
                <ArrowRight className="h-4 w-4" />
              </span>
            </ButtonLink>
            <a className="performance-text-link" href="#performance-framework">
              See the framework
              <ArrowDown aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
          <div className="performance-principles" aria-label="D2D Marketing approach">
            <span><Crosshair aria-hidden="true" /> Clear target</span>
            <span><TimerReset aria-hidden="true" /> Consistent cadence</span>
            <span><Gauge aria-hidden="true" /> Measured improvement</span>
          </div>
        </div>

        <div className="performance-board" aria-label="Performance framework">
          <div className="performance-board-top">
            <div>
              <p>D2D / GROWTH SYSTEM</p>
              <span>Leadership operating framework</span>
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
      <p className="performance-side-note">Built for the work between the big moments</p>
    </section>
  );
}
