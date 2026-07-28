import { ArrowRight } from "lucide-react";

const marketingUrl = "https://d2dmktg.com";
const digitalUrl = "/digital";

export function EcosystemPositionSection() {
  return (
    <section className="performance-ecosystem-position">
      <div className="performance-ecosystem-heading">
        <p className="eyebrow-label">How the work connects</p>
        <h2 className="font-display">
          The improvement stage of a connected business journey.
        </h2>
        <p>
          D2D Marketing brings brand clarity, growth strategy, leadership
          alignment, and digital execution into one practical operating
          conversation.
        </p>
      </div>

      <div className="performance-ecosystem-stages">
        <a href={marketingUrl}>
          <div className="performance-stage-top">
            <span>Start here</span>
          </div>
          <h3 className="font-display">D2D Marketing</h3>
          <p>
            Clarify the brand, sharpen the message, and create the marketing
            rhythm that connects the business to the right people.
          </p>
          <small>Brand strategy · Messaging · Campaigns · Content</small>
          <strong>
            Explore the main practice <ArrowRight aria-hidden="true" />
          </strong>
        </a>

        <a href={digitalUrl}>
          <div className="performance-stage-top">
            <span>Build it</span>
          </div>
          <h3 className="font-display">D2D Digital</h3>
          <p>
            Turn the strategy into a website, useful digital tool, connected
            workflow, or platform people can actually use.
          </p>
          <small>Websites · Tools · Portals · Integrations</small>
          <strong>
            Continue to D2D Digital <ArrowRight aria-hidden="true" />
          </strong>
        </a>

        <article className="is-current">
          <div className="performance-stage-top">
            <span>Improve it</span>
            <em>Current</em>
          </div>
          <h3 className="font-display">D2D Marketing</h3>
          <p>
            Align leadership, establish the operating cadence, and improve the
            systems that turn strategy into repeatable execution.
          </p>
          <small>Strategy · Leadership · Systems · Optimization</small>
          <strong>Lead, measure, and improve</strong>
        </article>
      </div>
    </section>
  );
}
