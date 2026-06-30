const editorialItems = [
  {
    number: "01",
    title: "Decision drag",
    body: "When too many decisions wait for the founder, speed disappears quietly.",
  },
  {
    number: "02",
    title: "Ownership gaps",
    body: "When everyone is involved but nobody is accountable, priorities stall.",
  },
  {
    number: "03",
    title: "Meeting fatigue",
    body: "When the room is busy but the business does not move, the cadence is broken.",
  },
  {
    number: "04",
    title: "Founder bottlenecks",
    body: "When the company keeps growing but authority does not, leadership becomes a constraint.",
  },
  {
    number: "05",
    title: "Execution debt",
    body: "When small unresolved issues compound, the business pays for them every week.",
  },
  {
    number: "06",
    title: "Leadership friction",
    body: "When smart people are misaligned, the cost shows up in follow-through.",
  },
] as const;

export function EditorialList() {
  return (
    <section className="px-6 py-22 lg:px-8 lg:py-30">
      <div className="mx-auto max-w-[88rem]">
        <div className="grid gap-10 lg:grid-cols-[0.42fr_0.58fr]">
          <div>
            <p className="eyebrow-label">What We Work On</p>
            <h2 className="mt-5 max-w-md font-display text-[clamp(2.4rem,5vw,5rem)] leading-[0.98] tracking-[-0.06em] text-[var(--color-ink)]">
              The business rarely says it plainly.
            </h2>
          </div>

          <div className="space-y-7">
            {editorialItems.map((item, index) => (
              <article
                key={item.title}
                className={`grid gap-4 border-t border-[var(--color-border)] pt-6 md:grid-cols-[5rem_minmax(0,1fr)] ${
                  index % 2 === 1 ? "lg:ml-18" : ""
                }`}
              >
                <span className="font-display text-4xl tracking-[-0.06em] text-[color:color-mix(in_oklab,var(--color-accent)_56%,white)]">
                  {item.number}
                </span>
                <div>
                  <h3 className="text-[1.55rem] tracking-[-0.04em] text-[var(--color-ink)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-base leading-8 text-[var(--color-muted)]">
                    {item.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
