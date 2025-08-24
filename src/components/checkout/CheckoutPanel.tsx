"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import type { Appearance, Stripe } from "@stripe/stripe-js";

import SessionBlock from "@/components/SessionBlock";
import PaymentChooser from "@/components/checkout/PaymentChooser";
import CardForm from "@/components/checkout/CardForm";
import type { Breakdown } from "@/components/checkout/buildBreakdown";

import StepContact from "./CheckoutSteps/StepContact";
import StepChoose from "./CheckoutSteps/StepChoose";
import StepPayDetails from "./CheckoutSteps/StepPayDetails";
import StepSummary from "./CheckoutSteps/StepSummary";

/* Local type */
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
  // Steps: 0=contact, 1=choose, 2=payment details, 3=summary
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [dir, setDir] = useState<1 | -1>(1);

  const goNext = () => { setDir(1); setStep((s) => (s === 3 ? 3 : (s + 1) as 0 | 1 | 2 | 3)); };
  const goBack = () => { setDir(-1); setStep((s) => (s === 0 ? 0 : (s - 1) as 0 | 1 | 2 | 3)); };

  // Contact state
  
  const [email, setEmail] = useState("");
  const [discord, setDiscord] = useState("");
  const [notes, setNotes] = useState("");
  const [contactErr, setContactErr] = useState<string | null>(null);
// Contact state
const emailRef = useRef<HTMLInputElement>(null);
const discordRef = useRef<HTMLInputElement>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const discordRegex = /^[A-Za-z0-9][A-Za-z0-9._]{1,31}$/;

  function validateContact(): boolean {
    const e = email.trim(); const d = discord.trim();
emailRef.current?.setCustomValidity("");
discordRef.current?.setCustomValidity("");    if (!e || !d) { setContactErr("Please enter both email and Discord."); if (!e) emailRef.current?.focus(); else discordRef.current?.focus(); return false; }
    if (!emailRegex.test(e)) { setContactErr(""); emailRef.current?.reportValidity(); return false; }
    if (!discordRegex.test(d)) { setContactErr(""); discordRef.current?.reportValidity(); return false; }
    setContactErr(null); return true;
  }

  // Payment / Stripe
  const [payMethod, setPayMethod] = useState<PayMethod>("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [piId, setPiId] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);

  function chooseAndGo(m: PayMethod) {
    if (!m) return;
    setPayMethod(m);
    setClientSecret(null);
    setPiId(null);
    setDir(1);
    setStep(2);
  }

  useEffect(() => {
    const isStripeFlow = payMethod === "card" || payMethod === "paypal" || payMethod === "revolut_pay";
    if (step !== 2 || !isStripeFlow) return;
    let on = true;
    (async () => {
      setLoadingIntent(true);
      try {
        const res = await fetch("/api/stripe/checkout/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payloadForBackend, payMethod }),
        });
        const data = await res.json().catch(() => ({}));
        if (!on) return;
        if (res.ok && data?.clientSecret) {
          setClientSecret(data.clientSecret);
          setPiId(String(data.clientSecret).split("_secret")[0] || null);
        } else {
          console.error("INTENT_FAIL", data);
          setClientSecret(null);
          setPiId(null);
        }
      } finally { if (on) setLoadingIntent(false); }
    })();
    return () => { on = false; };
  }, [step, payMethod, payloadForBackend]);

  // Anim
  const variants = {
    enter: (d: 1 | -1) => ({ x: d * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: 1 | -1) => ({ x: d * -40, opacity: 0 }),
  };

  // Waiver
  const [waiver, setWaiver] = useState(false);

  return (
    <div className="relative rounded-2xl p-5 md:p-6 backdrop-blur-md bg-[#0B1220]/80 ring-1 ring-[rgba(146,180,255,.18)]">
      <div className="relative space-y-4">
        <SessionBlock
          layoutId="session-block"
          minutes={payload.baseMinutes}
          liveBlocks={payload.liveBlocks}
          followups={payload.followups}
          priceEUR={breakdown.total}
          className="mb-2"
        />

        <div className="relative min-h-[460px]">
          <AnimatePresence custom={dir} mode="wait">
            {/* Step 0 */}
            {step === 0 && (
              <motion.div key="step-contact" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: "easeOut" }} className="absolute inset-0">
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
              <motion.div key="step-choose" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: "easeOut" }} className="absolute inset-0">
                <StepChoose goBack={goBack} onChoose={(m) => chooseAndGo(m as PayMethod)} />
              </motion.div>
            )}

            {/* Step 2: static loader until clientSecret */}
            {step === 2 && !clientSecret && (
              <div className="absolute inset-0">
                <StepPayDetails
                  mode="loading"
                  goBack={goBack}
                  loadingIntent={loadingIntent}
                />
              </div>
            )}

            {/* Steps 2 & 3 share one Elements instance (stable key) */}
            {(step === 2 || step === 3) && clientSecret && (
              <Elements key="stripe-elements" stripe={stripePromise} options={{ clientSecret, appearance, loader: "never" }}>
                {step === 2 && (
                  <motion.div key="step-paydetails" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: "easeOut" }} className="absolute inset-0">
                    <StepPayDetails
                      mode="form"
                      goBack={goBack}
                      email={email}
                      payMethod={payMethod || "card"}
                      onContinue={goNext}
                      piId={piId}
                    />
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step-summary" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: "easeOut" }} className="absolute inset-0">
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
                  </motion.div>
                )}
              </Elements>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-3 pt-1 text-white/80">
          <span className="inline-flex items-center gap-2 text-xs">🔒 3D Secure ready</span>
          <span className="inline-flex items-center gap-2 text-xs">🛡️ Buyer protection</span>
        </div>
      </div>
    </div>
  );
}
