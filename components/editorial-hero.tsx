"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ScrollRevealText } from "@/components/scroll-reveal-text";

export function EditorialHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-20 lg:px-8 lg:pt-40 lg:pb-28">
      <div className="mx-auto grid max-w-[88rem] gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:gap-10">
        <div className="relative">
          <p className="eyebrow-label">Executive Coaching</p>
          <div className="mt-8 max-w-5xl">
            <ScrollRevealText
              lines={[
                "Leadership gets lonely",
                "before it gets difficult.",
              ]}
            />
          </div>
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="mt-8 max-w-2xl text-lg leading-8 text-[var(--color-muted)] lg:ml-28"
          >
            We help founders and executive teams think clearly, make better
            decisions, and build operating rhythms that survive the real
            day-to-day of the business.
          </motion.p>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            className="mt-10 flex flex-wrap items-center gap-6 lg:ml-28"
          >
            <Link
              href="/contact"
              className="inline-flex items-center border-b border-[var(--color-border-strong)] pb-2 text-sm font-medium uppercase tracking-[0.18em] text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Schedule a conversation
            </Link>
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
              For owners carrying meaningful complexity.
            </p>
          </motion.div>
        </div>

        <motion.aside
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="ink-wash paper-panel relative min-h-[28rem] rounded-[1.6rem] px-7 py-8 lg:mt-10"
        >
          <div className="operating-lines absolute inset-0 rounded-[1.6rem] opacity-55" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="eyebrow-label">Day2Day Observation</p>
                <p className="mt-4 max-w-sm text-base leading-8 text-[var(--color-muted)]">
                  Businesses rarely break all at once. They get heavier in the
                  spaces between ownership, meetings, follow-through, and the
                  founder&apos;s attention.
                </p>
              </div>
              <span className="font-display text-[7rem] leading-none tracking-[-0.08em] text-[color:color-mix(in_oklab,var(--color-accent)_36%,white)] lg:text-[10rem]">
                01
              </span>
            </div>
            <div className="relative mt-16 border-t border-[var(--color-border)] pt-5">
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Operating note
              </p>
              <p className="mt-3 max-w-xs text-base leading-7 text-[var(--color-ink)]">
                The founder becomes the operating system long before anyone
                says it out loud.
              </p>
            </div>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
