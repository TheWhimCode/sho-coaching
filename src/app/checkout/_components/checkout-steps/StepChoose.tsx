"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PaymentChooser, { PayMethod } from "@/app/checkout/_components/checkout-steps/step-components/PaymentChooser";
import { ArrowLeft } from "lucide-react";
import { useFooter } from "@/app/checkout/_components/checkout-steps/FooterContext";

type Props = {
  goBack: () => void;
  onChoose: (m: PayMethod) => void;
};

const BEFORE = "🔒 Checkout is secure — handled by ";
const STRIPE = "Stripe";

export default function StepChoose({ goBack, onChoose }: Props) {
  // gate the one-time animation with sessionStorage
  const [playReveal, setPlayReveal] = useState(false);

  // Hide the centralized PrimaryCTA on this step
  const [, setFooter] = useFooter();
  useEffect(() => {
    setFooter({ hidden: true, disabled: true, onClick: undefined, label: undefined, loading: false });
    return () => setFooter((s) => ({ ...s, hidden: false }));
  }, [setFooter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const shouldAnimate = sessionStorage.getItem("secureLineAnimated") !== "1";
    if (shouldAnimate) setPlayReveal(true);
  }, []);

  // Prevent accidental submit bubbling from nested buttons (desktop issue)
  const preventSubmitDefaults = (e: React.SyntheticEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && t.tagName === "BUTTON") {
      const btn = t as HTMLButtonElement;
      if (!btn.type || btn.type.toLowerCase() === "submit") e.preventDefault();
    }
  };
  const preventEnterSubmit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault();
  };

  return (
    <div className="h-full flex flex-col pt-2" onClickCapture={preventSubmitDefaults} onKeyDownCapture={preventEnterSubmit}>
      {/* Header */}
      <div className="mb-3">
        <div className="relative h-7 flex items-center justify-center">
          <button
            onClick={goBack}
            className="absolute left-0 inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="text-sm text-white/80">Choose payment</div>
        </div>
        <div className="mt-2 border-t border-white/10" />
      </div>

      {/* Payment chooser */}
      <div>
        <PaymentChooser mode="choose" onChoose={onChoose} />
      </div>

      {/* Secure line directly below chooser (top-aligned), with one-time slide+fade reveal */}
      <motion.div
        className="mt-4 text-center text-sm text-white/70"
        initial={playReveal ? { opacity: 0, y: 12 } : false}
        animate={playReveal ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onAnimationComplete={() => {
          if (playReveal && typeof window !== "undefined") {
            sessionStorage.setItem("secureLineAnimated", "1");
            setPlayReveal(false);
          }
        }}
      >
        <motion.span
          className="inline-block font-medium"
          initial={{ textShadow: "0 0 0px rgba(255,255,255,0)" }}
          animate={{
            textShadow: [
              "0 0 0px rgba(255,255,255,0)",
              "0 0 8px rgba(255, 255, 255, 1)",
              "0 0 0px rgba(255,255,255,0)",
            ],
          }}
          transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
        >
          {BEFORE}
          <span className="font-semibold text-white">{STRIPE}</span>
        </motion.span>
      </motion.div>

      <div className="flex-1" />
    </div>
  );
}
