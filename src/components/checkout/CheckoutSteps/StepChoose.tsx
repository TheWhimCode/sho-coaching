"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PaymentChooser from "@/components/checkout/PaymentChooser";

type Props = {
  goBack: () => void;
  onChoose: (m: string) => void;
};

const BEFORE = "🔒 Checkout is secure — handled by ";
const STRIPE = "Stripe";

export default function StepChoose({ goBack, onChoose }: Props) {
  // Determine once, *before* first render effect runs
  const [shouldAnimate] = useState<boolean>(() => {
    if (typeof window === "undefined") return false; // SSR: no animation
    return sessionStorage.getItem("secureLineAnimated") !== "1";
  });

  return (
    <div className="h-full flex flex-col rounded-xl p-4 bg-transparent">
      {/* Header */}
      <div className="mb-3">
        <div className="relative h-7 flex items-center justify-center">
          <button
            onClick={goBack}
            className="absolute left-0 text-sm text-white/80 hover:text-white"
          >
            ← Back
          </button>
          <div className="text-sm text-white/80">Choose payment</div>
        </div>
        <div className="mt-2 border-t border-white/10" />
      </div>

      {/* Payment chooser */}
      <div className="flex-1">
        <PaymentChooser mode="choose" onChoose={onChoose} />
      </div>

      {/* Secure line: letter slide-in (first time only) + glow */}
      <motion.div
        className="mt-6 text-center text-sm text-white/70 securePulse"
        initial={shouldAnimate ? "hidden" : "visible"}
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.012 } } }}
        onAnimationComplete={() => {
          if (shouldAnimate && typeof window !== "undefined") {
            sessionStorage.setItem("secureLineAnimated", "1");
          }
        }}
      >
        {BEFORE.split("").map((ch, i) => (
          <motion.span
            key={`pre-${i}`}
            variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}
            transition={{ duration: 0.14, ease: "easeOut" }}
          >
            {ch}
          </motion.span>
        ))}
        {STRIPE.split("").map((ch, i) => (
          <motion.span
            key={`stripe-${i}`}
            className="font-semibold text-white"
            variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}
            transition={{ duration: 0.14, ease: "easeOut" }}
          >
            {ch}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
