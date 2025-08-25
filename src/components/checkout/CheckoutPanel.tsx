// src/app/checkout/CheckoutPanel.tsx
"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import type { Appearance, Stripe } from "@stripe/stripe-js";

import SessionBlock from "@/components/SessionBlock";
import type { Breakdown } from "@/components/checkout/buildBreakdown";

import StepContact from "./CheckoutSteps/StepContact";
import StepChoose from "./CheckoutSteps/StepChoose";
import StepPayDetails from "./CheckoutSteps/StepPayDetails";
import StepSummary from "./CheckoutSteps/StepSummary";

type PayMethod = "" | "card" | "paypal" | "revolut_pay";

type Payload = {
  slotId: string;
  sessionType: string;
  baseMinutes: number;
  liveMinutes: number;
  followups: number;
  liveBlocks: number;
  discord: string;
  preset: string;
  holdKey: string;
};

type Props = {
  payload: Payload;
  breakdown: Breakdown;
  stripePromise: Promise<Stripe | null>;
  appearance: Appearance;
  payloadForBackend: any;
};

export default function CheckoutPanel({
  payload,
  breakdown,
  stripePromise,
  appearance,
  payloadForBackend,
}: Props) {
  // Steps: 0 contact → 1 choose → 2 pay → 3 summary
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [dir, setDir] = useState<1 | -1>(1);

  const goNext = () => { setDir(1); setStep((s) => (s === 3 ? 3 : (s + 1) as 0 | 1 | 2 | 3)); };
  const goBack = () => { setDir(-1); setStep((s) => (s === 0 ? 0 : (s - 1) as 0 | 1 | 2 | 3)); };

  // Contact state
  const [email, setEmail] = useState("");
  const [discord, setDiscord] = useState("");
  const [notes, setNotes] = useState("");
  const [contactErr, setContactErr] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const discordRef = useRef<HTMLInputElement>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const discordRegex = /^[A-Za-z0-9][A-Za-z0-9._]{1,31}$/;

  function validateContact(): boolean {
    const e = email.trim();
    const d = discord.trim();
    emailRef.current?.setCustomValidity("");
    discordRef.current?.setCustomValidity("");
    if (!e || !d) {
      setContactErr("Please enter both email and Discord.");
      if (!e) emailRef.current?.focus(); else discordRef.current?.focus();
      return false;
    }
    if (!emailRegex.test(e)) { setContactErr(""); emailRef.current?.reportValidity(); return false; }
    if (!discordRegex.test(d)) { setContactErr(""); discordRef.current?.reportValidity(); return false; }
    setContactErr(null);
    return true;
  }

  // Payment / Stripe
  const [payMethod, setPayMethod] = useState<PayMethod>("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [piId, setPiId] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);

  // Track the "current" method to avoid setting stale results if user switches rapidly
  const currentMethodRef = useRef<PayMethod>("");

  // Optimistic navigation: jump to step 2 immediately; fetch PI in background
  async function chooseAndGo(m: PayMethod) {
    if (!m) return;
    setDir(1);
    setPayMethod(m);
    currentMethodRef.current = m;

    // Clear previous PI so step 2 shows the method-aware loader
    setClientSecret(null);
    setPiId(null);

    // Go to step 2 right away
    setStep(2);

    // Fire the request in the background (per-method PI)
    setLoadingIntent(true);
    try {
      const res = await fetch("/api/stripe/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payloadForBackend, payMethod: m }),
      });
      const data = await res.json().catch(() => ({}));
      // Only apply if we're still on the same method
      if (currentMethodRef.current !== m) return;

      if (res.ok && data?.clientSecret) {
        setClientSecret(data.clientSecret);
        setPiId(String(data.clientSecret).split("_secret")[0] || null);
      } else {
        console.error("INTENT_FAIL", data);
        setClientSecret(null);
        setPiId(null);
      }
    } finally {
      if (currentMethodRef.current === m) setLoadingIntent(false);
    }
  }

  // Anim
  const variants = {
    enter: (d: 1 | -1) => ({ x: d * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: 1 | -1) => ({ x: d * -40, opacity: 0 }),
  };

  // Waiver
  const [waiver, setWaiver] = useState(false);

  return (
    <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-orange-400/30 via-orange-300/10 to-transparent">
      <div
        className="
          relative rounded-2xl p-5 md:p-6 
          backdrop-blur-md
          bg-[rgba(25,32,52,0.9)]
          shadow-[0_12px_40px_rgba(0,0,0,0.7)]
          ring-1 ring-orange-300/20
        "
      >
        <div className="relative space-y-4">
          {/* Glowing/breathing border around SessionBlock (requires .animate-border-glow in globals) */}
          <div className="relative rounded-xl">
            <div className="absolute inset-0 rounded-xl ring-2 ring-sky-400/80 animate-border-glow pointer-events-none" />
            <SessionBlock
              layoutId="session-block"
              minutes={payload.baseMinutes}
              liveBlocks={payload.liveBlocks}
              followups={payload.followups}
              priceEUR={breakdown.total}
              className="mb-2 relative"
            />
          </div>

          <div className="relative min-h-[460px]">
            <AnimatePresence custom={dir} mode="wait" initial={false}>
              {/* Step 0 */}
              {step === 0 && (
                <motion.div
                  key="step-contact"
                  custom={dir}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="absolute inset-0 rounded-xl bg-[rgba(10,15,30,0.95)] ring-1 ring-sky-400/10 shadow-inner shadow-black/40"
                >
                  <StepContact
                    email={email}
                    discord={discord}
                    notes={notes}
                    setEmail={setEmail}
                    setDiscord={setDiscord}
                    setNotes={setNotes}
                    contactErr={contactErr}
                    emailInputRef={emailRef}
                    discordInputRef={discordRef}
                    onSubmit={() => validateContact() && goNext()}
                  />
                </motion.div>
              )}

              {/* Step 1 */}
              {step === 1 && (
                <motion.div
                  key="step-choose"
                  custom={dir}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="absolute inset-0 rounded-xl bg-[rgba(10,15,30,0.95)] ring-1 ring-sky-400/10 shadow-inner shadow-black/40"
                >
                  <StepChoose goBack={goBack} onChoose={(m) => chooseAndGo(m as PayMethod)} />
                </motion.div>
              )}

              {/* Step 2: method-aware loader until clientSecret arrives */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  custom={dir}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="absolute inset-0 rounded-xl bg-[rgba(10,15,30,0.95)] ring-1 ring-sky-400/10 shadow-inner shadow-black/40"
                >
                  {clientSecret ? (
                    <Elements stripe={stripePromise} options={{ clientSecret, appearance, loader: "never" }}>
                      <StepPayDetails
                        mode="form"
                        goBack={goBack}
                        email={email}
                        payMethod={payMethod || "card"}
                        onContinue={goNext}
                        piId={piId}
                      />
                    </Elements>
                  ) : (
                    // NOTE: add `payMethod?: "card" | "paypal" | "revolut_pay"` to StepPayDetails' loading props.
                    <StepPayDetails
                      mode="loading"
                      goBack={goBack}
                      loadingIntent={loadingIntent}
                      payMethod={payMethod || "card"}
                    />
                  )}
                </motion.div>
              )}

              {/* Step 3 */}
              {step === 3 && clientSecret && (
                <motion.div
                  key="step-summary"
                  custom={dir}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="absolute inset-0 rounded-xl bg-[rgba(10,15,30,0.95)] ring-1 ring-sky-400/10 shadow-inner shadow-black/40"
                >
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance, loader: "never" }}>
                    <StepSummary
                      goBack={goBack}
                      waiver={waiver}
                      setWaiver={setWaiver}
                      payload={payload}
                      breakdown={breakdown}
                      payMethod={payMethod || "card"}
                      email={email}
                      piId={piId}
                    />
                  </Elements>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3 pt-1 text-white/80">
            <span className="inline-flex items-center gap-2 text-xs">🔒 3D Secure ready</span>
            <span className="inline-flex items-center gap-2 text-xs">🛡️ Buyer protection</span>
          </div>
        </div>
      </div>
    </div>
  );
}
