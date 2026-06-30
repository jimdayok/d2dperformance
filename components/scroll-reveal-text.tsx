"use client";

import { motion, useReducedMotion } from "framer-motion";

type ScrollRevealTextProps = {
  lines: string[];
  className?: string;
};

export function ScrollRevealText({
  lines,
  className = "",
}: ScrollRevealTextProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className={className}>
      {lines.map((line, index) => (
        <motion.div
          key={line}
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.7 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: index * 0.06 }}
          className="overflow-hidden"
        >
          <p className="font-display text-[clamp(2.7rem,8vw,6rem)] leading-[0.94] tracking-[-0.06em] text-[var(--color-ink)]">
            {line}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
