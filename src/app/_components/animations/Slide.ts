// slide.ts
import { Variants } from "framer-motion";

/**
 * Generic horizontal slide-in/out animation.
 * Not drawer-specific.
 */

export const slideHorizontal: Variants = {
  initial: { x: -24, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -24, opacity: 0 },
};

export const slideTransition = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1],
};
