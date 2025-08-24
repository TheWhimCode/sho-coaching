"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import type { Appearance, Stripe } from "@stripe/stripe-js";

import SessionBlock from "@/components/SessionBlock";
import SummaryCard from "@/components/checkout/SummaryCard";
import PaymentChooser from "@/components/checkout/PaymentChooser";
import CardForm from "@/components/checkout/CardForm";
import type { Breakdown } from "@/components/checkout/buildBreakdown";

/* Local type (keeps us decoupled) */
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

  // stripe infra
  stripePromise: Promise<Stripe | null>;
  appearance: Appearance;

  // server payload we POST
  payloadForBackend: any;
};

export default function CheckoutPanel({
  payload,
  breakdown,
  stripePromise,
  appearance,
  payloadForBackend,
}: Props) {
  /* ------------------------------
     Steps: 0=summary, 1=contact, 2=choose, 3=pay
     ------------------------------ */
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [dir, setDir] = useState<1 | -1>(1);

  const goNext = () => {
    setDir(1);
    setStep((s) => (s === 3 ? 3 : (s + 1) as 1 | 2 | 3));
  };
  const goBack = () => {
    setDir(-1);
    setStep((s) => (s === 0 ? 0 : (s - 1) as 0 | 1 | 2));
  };

  /* ------------------------------
     Contact details (step 1)
     ------------------------------ */
  const [email, setEmail] = useState("");
  const [discord, setDiscord] = useState("");
  const [contactErr, setContactErr] = useState<string | null>(null);

  function validateContact() {
    if (!email.trim() || !discord.trim()) {
      setContactErr("Please enter both email and Discord.");
      return false;
    }
    setContactErr(null);
    return true;
  }

  /* ------------------------------
     Payment method + PI lifecycle (step 3)
     ------------------------------ */
  const [payMethod, setPayMethod] = useState<PayMethod>("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [piId, setPiId] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);

  // From step 2, when a badge is chosen -> go to step 3 and reset intent
  function chooseAndGo(m: PayMethod) {
    if (!m) return;
    setPayMethod(m);
    setClientSecret(null);
    setPiId(null);
    setDir(1);
    setStep(3);
  }

  // Create PI when we *enter* step 3 with a selected method
  useEffect(() => {
    const isStripeFlow =
      payMethod === "card" || payMethod === "paypal" || payMethod === "revolut_pay";
    if (step !== 3 || !isStripeFlow) return;

    let on = true;
    (async () => {
      setLoadingIntent(true);
      try {
        const res = await fetch("/api/stripe/checkout/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // include selected method so server pins `payment_method_types`
          body: JSON.stringify({ ...payloadForBackend, email, discord, payMethod }),
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
      } finally {
        if (on) setLoadingIntent(false);
      }
    })();

    return () => {
      on = false;
    };
  }, [step, payMethod, payloadForBackend, email, discord]);

  /* ------------------------------
     Animation helpers
     ------------------------------ */
  const variants = {
    enter: (d: 1 | -1) => ({ x: d * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: 1 | -1) => ({ x: d * -40, opacity: 0 }),
  };

  return (
    <div
      className="relative rounded-2xl p-5 md:p-6
                 backdrop-blur-md bg-[#0B1220]/80
                 ring-1 ring-[rgba(146,180,255,.18)]"
    >
      <div className="relative space-y-4">
        {/* Pinned session header */}
        <SessionBlock
          layoutId="session-block"
          minutes={payload.baseMinutes}
          liveBlocks={payload.liveBlocks}
          followups={payload.followups}
          priceEUR={breakdown.total}
          className="mb-2"
        />

        {/* Sliding stage — unified height for all steps */}
        <div className="relative min-h-[340px]">
          <AnimatePresence custom={dir} mode="wait">
            {step === 0 && (
              <motion.div
                key="step-summary"
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <SummaryCard
                  baseMinutes={payload.baseMinutes}
                  liveBlocks={payload.liveBlocks}
                  followups={payload.followups}
                  breakdown={breakdown}
                  isOpen={true}
                  onConfirm={() => {
                    setDir(1);
                    setStep(1);
                  }}
                />
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-contact"
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <div className="h-full flex flex-col rounded-xl p-4 ring-1 ring-white/12 bg-white/[.04]">
                  {/* Header row with Back inside + divider; equal spacing top/underline */}
                  <div className="mb-3">
                    <div className="relative h-7 flex items-center justify-center">
                      <button
                        onClick={goBack}
                        className="absolute left-0 text-sm text-white/80 hover:text-white"
                      >
                        ← Back
                      </button>
                      <div className="text-sm text-white/80">Contact details</div>
                    </div>
                    <div className="mt-2 border-t border-white/10" />
                  </div>

                  {/* fields */}
                  <div className="flex-1 space-y-3">
                    <label className="block">
                      <span className="text-xs text-white/65">Email</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="mt-1 w-full rounded-lg bg-white/[.05] ring-1 ring-white/12 px-4 py-3 text-base text-white/90 outline-none focus:ring-white/25"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs text-white/65">Discord</span>
                      <input
                        type="text"
                        value={discord}
                        onChange={(e) => setDiscord(e.target.value)}
                        placeholder="username#0000"
                        className="mt-1 w-full rounded-lg bg-white/[.05] ring-1 ring-white/12 px-4 py-3 text-base text-white/90 outline-none focus:ring-white/25"
                        required
                      />
                    </label>
                    {contactErr && <p className="text-sm text-red-400">{contactErr}</p>}
                  </div>

                  <button
                    onClick={() => {
                      if (validateContact()) goNext();
                    }}
                    className="mt-3 w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A]
                               bg-[#fc8803] hover:bg-[#f8a81a] transition
                               shadow-[0_10px_28px_rgba(245,158,11,.35)]
                               ring-1 ring-[rgba(255,190,80,.55)]"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-choose"
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <div className="h-full flex flex-col rounded-xl p-4 ring-1 ring-white/12 bg-white/[.04]">
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

                  {/* badges-only chooser */}
                  <div className="flex-1">
                    <PaymentChooser
                      // chooser mode: only show badges, no Stripe elements here
                      mode="choose"
                      onChoose={(m) => chooseAndGo(m as PayMethod)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-pay"
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <div className="h-full flex flex-col rounded-xl p-4 ring-1 ring-white/12 bg-white/[.04]">
                  <div className="mb-3">
                    <div className="relative h-7 flex items-center justify-center">
                      <button
                        onClick={() => {
                          setDir(-1);
                          setStep(2);
                        }} // go back to chooser (not contact)
                        className="absolute left-0 text-sm text-white/80 hover:text-white"
                      >
                        ← Back
                      </button>
                      <div className="text-sm text-white/80">
                        {payMethod === "card"
                          ? "Card payment"
                          : payMethod === "paypal"
                          ? "PayPal"
                          : "Revolut Pay"}
                      </div>
                    </div>
                    <div className="mt-2 border-t border-white/10" />
                  </div>

                  <div className="flex-1">
                    {clientSecret ? (
                      <Elements
                        key={clientSecret}
                        stripe={stripePromise}
                        options={{ clientSecret, appearance, loader: "auto" }}
                      >
                        <CardForm
                          piId={piId}
                          email={email}
                          activePm={
                            (payMethod || "card") as "card" | "paypal" | "revolut_pay"
                          }
                        />
                      </Elements>
                    ) : (
                      <div className="space-y-2">
                        {loadingIntent ? (
                          <>
                            <Shimmer />
                            <Shimmer />
                            <Shimmer />
                          </>
                        ) : (
                          <div className="text-white/80">Preparing payment…</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* badges */}
        <div className="flex items-center gap-3 pt-1 text-white/80">
          <span className="inline-flex items-center gap-2 text-xs">
            🔒 3D Secure ready
          </span>
          <span className="inline-flex items-center gap-2 text-xs">
            🛡️ Buyer protection
          </span>
        </div>
      </div>
    </div>
  );
}

/** lightweight shimmer used in loading states */
function Shimmer() {
  return (
    <div
      className="relative h-10 rounded-lg ring-1 ring-white/12 bg-white/[0.05] overflow-hidden"
      aria-busy
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
          mixBlendMode: "overlay",
          animation: "shimmer 1.2s linear infinite",
          transform: "translateX(-100%)",
        }}
      />
      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  );
}
