"use client";

import { motion } from "framer-motion";
import { useState } from "react";

type Props = {
  play: boolean;
  onDone: () => void;
  a: React.ReactNode; // placeholder
  b: React.ReactNode; // stats
};

export default function DualWipeLR({ play, onDone, a, b }: Props) {
  const D = 0.8;
  const START_DELAY = 0.25;  // ← global delay
  const OFFSET = 0.01;       // B starts just after A
  const [doneOnce, setDoneOnce] = useState(false);

  // small vertical bleed avoids bottom-row clipping
  const BLEED = 2; // px
  const outStart   = `inset(-${BLEED}px 0% -${BLEED}px 0)`;
  const outFinish  = `inset(-${BLEED}px 0% -${BLEED}px 100%)`;
  const inStart    = `inset(-${BLEED}px 100% -${BLEED}px 0)`;
  const inFinish   = `inset(-${BLEED}px 0% -${BLEED}px 0)`;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* A OUT */}
      <motion.div
        style={{ willChange: "clip-path" }}
        initial={{ clipPath: outStart }}
        animate={{ clipPath: play ? outFinish : outFinish }}
        transition={{ duration: D, delay: START_DELAY, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        {a}
      </motion.div>

      {/* B IN */}
      <motion.div
        style={{ willChange: "clip-path" }}
        initial={{ clipPath: inStart }}
        animate={{ clipPath: play ? inFinish : inFinish }}
        transition={{ duration: D, delay: START_DELAY + OFFSET, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={() => {
          if (!doneOnce) { setDoneOnce(true); onDone(); }
        }}
        className="absolute inset-0"
      >
        {b}
      </motion.div>
    </div>
  );
}
