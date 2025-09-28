// src/app/_components/animations/Fade.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";

type Props = {
  children: React.ReactNode;
  /** seconds */
  duration?: number;
};

/**
 * Exit-only fade wrapper.
 * - No fade-in (initial={false}).
 * - On route change, previous page fades to 0 over `duration`.
 * - Use inside a route `template.tsx` so Next.js waits for exit.
 */
export default function Fade({ children, duration = 1 }: Props) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key="fade-wrapper"
        initial={false}                // don't animate on mount
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}          // only animate on unmount
        transition={{ duration }}      // 1s default
        style={{ height: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
