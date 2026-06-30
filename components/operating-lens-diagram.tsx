"use client";

import { motion, useReducedMotion } from "framer-motion";

const layers = [
  {
    title: "Leadership conversations",
    body: "What gets said clearly enough for everyone to leave with the same decision.",
  },
  {
    title: "Operating rhythm",
    body: "The weekly cadence that determines whether priorities stay visible or disappear into motion.",
  },
  {
    title: "Follow-through",
    body: "What actually happens by Friday, when ownership is tested against real work.",
  },
] as const;

export function OperatingLensDiagram() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="px-6 py-22 lg:px-8 lg:py-30">
      <div className="mx-auto grid max-w-[88rem] gap-10 lg:grid-cols-[0.38fr_0.62fr] lg:gap-14">
        <div>
          <p className="eyebrow-label">The D2D Operating Lens</p>
          <h2 className="mt-5 font-display text-[clamp(2.5rem,5.4vw,5.2rem)] leading-[0.98] tracking-[-0.06em] text-[var(--color-ink)]">
            The Day2Day Gap
          </h2>
          <p className="mt-5 max-w-md text-lg leading-8 text-[var(--color-muted)]">
            The space between what leaders agree matters and what actually
            happens by Friday.
          </p>
        </div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="paper-panel operating-lines relative rounded-[1.6rem] px-6 py-8 md:px-8 md:py-10"
        >
          <div className="absolute left-[9%] top-8 bottom-8 w-px bg-[var(--color-border)]" />
          <div className="absolute left-[9%] right-[12%] top-[22%] h-px bg-[var(--color-border)]" />
          <div className="absolute left-[9%] right-[16%] top-[50%] h-px bg-[var(--color-border)]" />
          <div className="absolute left-[9%] right-[20%] top-[78%] h-px bg-[var(--color-border)]" />

          <div className="relative space-y-8">
            {layers.map((layer, index) => (
              <div
                key={layer.title}
                className={`grid gap-4 md:grid-cols-[7rem_minmax(0,1fr)] ${
                  index === 1 ? "md:ml-10" : index === 2 ? "md:ml-20" : ""
                }`}
              >
                <span className="font-display text-5xl tracking-[-0.06em] text-[color:color-mix(in_oklab,var(--color-accent)_40%,white)]">
                  0{index + 1}
                </span>
                <div className="pt-2">
                  <h3 className="text-[1.45rem] tracking-[-0.03em] text-[var(--color-ink)]">
                    {layer.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-base leading-8 text-[var(--color-muted)]">
                    {layer.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
