"use client";

import { motion, useReducedMotion } from "framer-motion";

export function NarrativeSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="px-6 py-22 lg:px-8 lg:py-32">
      <div className="mx-auto grid max-w-[88rem] gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow-label">Monday Morning</p>
          <p className="mt-6 max-w-sm text-lg leading-8 text-[var(--color-muted)]">
            This is the part most firms abstract away. We start where the week
            actually begins.
          </p>
        </div>

        <div className="space-y-8">
          {[
            "Monday morning. The leadership meeting starts.",
            "Everyone reports activity. Nobody owns outcomes.",
            "The same three issues return.",
            "Nothing is technically broken, but the business is heavier than it should be.",
          ].map((line, index) => (
            <motion.p
              key={line}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.7 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 }}
              className={`border-l pl-6 font-display tracking-[-0.05em] ${
                index < 3
                  ? "border-[var(--color-border)] text-[clamp(2.1rem,4.6vw,4.8rem)] leading-[1.02] text-[var(--color-ink)]"
                  : "border-[var(--color-accent)] text-[clamp(2.35rem,5vw,5rem)] leading-[0.98] text-[var(--color-taupe)]"
              }`}
            >
              {line}
            </motion.p>
          ))}

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.16 }}
            className="pt-6"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
              Where we begin
            </p>
            <p className="mt-3 max-w-xl text-[1.7rem] leading-[1.2] tracking-[-0.04em] text-[var(--color-ink)]">
              That is where we begin.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
