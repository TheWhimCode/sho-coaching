"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import type { Appearance, Stripe } from "@stripe/stripe-js";
import dynamic from "next/dynamic";

import SessionBlock from "@/pages/customization/components/SessionBlock";
import type { Breakdown } from "@/lib/checkout/buildBreakdown";

// Keep Choose/Contact/Summary SSR-safe; make PayDetails client-only (Stripe)
import StepContact from "./checkoutSteps/StepContact";
import StepChoose from "./checkoutSteps/StepChoose";
const StepPayDetails = dynamic(() => import("./checkoutSteps/StepPayDetails"), { ssr: false });
import StepSummary from "./checkoutSteps/StepSummary";

import { appearanceDarkBrand } from "@/lib/checkout/stripeAppearance";

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
  startTime?: string | number;
};

type Props = {
  payload: Payload;
  breakdown: Breakdown;
  stripePromise: Promise<Stripe | null>;
  appearance?: Appearance;
  payloadForBackend: any;
};

type SavedCard = {
  id: string;
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
};

// ✅ Default safe payload for SSR
const DEFAULT_PAYLOAD: Payload = {
  slotId: "",
  sessionType: "",
  baseMinutes: 60,
  liveMinutes: 60,
  followups: 0,
  liveBlocks: 0,
  discord: "",
  preset: "",
  holdKey: "",
};

export default function CheckoutPanel({
  payload,
  breakdown,
  stripePromise,
  appearance: appearanceProp,
  payloadForBackend,
}: Props) {
  const appearanceToUse = appearanceProp ?? appearanceDarkBrand;

  // ✅ Merge defaults with real payload
  const safePayload: Payload = { ...DEFAULT_PAYLOAD, ...payload };

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
      if (!e) emailRef.current?.focus();
      else discordRef.current?.focus();
      return false;
    }
    if (!emailRegex.test(e)) {
      setContactErr("");
      emailRef.current?.reportValidity();
      return false;
    }
    if (!discordRegex.test(d)) {
      setContactErr("");
      discordRef.current?.reportValidity();
      return false;
    }
    setContactErr(null);
    return true;
  }

  // Payment / Stripe
  const [payMethod, setPayMethod] = useState<PayMethod>("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [piId, setPiId] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);

  // Saved PaymentMethod
  const [cardPmId, setCardPmId] = useState<string | null>(null);
  const [savedCard, setSavedCard] = useState<SavedCard | null>(null);

  const currentMethodRef = useRef<PayMethod>("");

  async function chooseAndGo(m: PayMethod) {
    if (!m) return;
    setDir(1);
    setPayMethod(m);
    currentMethodRef.current = m;

    // reset Stripe state on method change
    setClientSecret(null);
    setPiId(null);
    setCardPmId(null);
    setSavedCard(null);

    setStep(2);

    setLoadingIntent(true);
    try {
      const res = await fetch("/api/stripe/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payloadForBackend, payMethod: m }),
      });
      const data = await res.json().catch(() => ({}));
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

  const variants = {
    enter: (d: 1 | -1) => ({ x: d * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: 1 | -1) => ({ x: d * -40, opacity: 0 }),
  };

  const [waiver, setWaiver] = useState(false);

  // Selected start time → show in SessionBlock header
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);

  useEffect(() => {
    function coerceToDate(v: unknown): Date | null {
      if (v == null) return null;
      if (typeof v === "number") { const d = new Date(v); return isNaN(d.getTime()) ? null : d; }
      if (typeof v === "string") { const d = new Date(v); return isNaN(d.getTime()) ? null : d; }
      return null;
    }

    const fromPayloadBackend = coerceToDate(payloadForBackend?.startTime);
    const fromPayload = coerceToDate((safePayload as any)?.startTime);

    if (fromPayloadBackend) { setSelectedStart(fromPayloadBackend); return; }
    if (fromPayload) { setSelectedStart(fromPayload); return; }

    if (typeof window !== "undefined") {
      const s = new URLSearchParams(window.location.search).get("startTime");
      const fromQuery = coerceToDate(s || undefined);
      if (fromQuery) setSelectedStart(fromQuery);
    }
  }, [payloadForBackend, payload]);

  return (
    <div className="relative rounded-2xl isolate">
      <div
        className="
          relative rounded-2xl p-5 md:p-6
          bg-[linear-gradient(135deg,#11182a_0%,#0e1526_45%,#0c1322_100%)]
          border border-[rgba(146,180,255,0.12)]
          ring-1 ring-[rgba(146,180,255,0.14)]
          shadow-[0_12px_40px_rgba(0,0,0,0.5)]
        "
      >
        <span
          aria-hidden
          className="
            pointer-events-none absolute inset-0 rounded-2xl
            bg-[radial-gradient(120%_120%_at_50%_0%,rgba(105,168,255,0.25),transparent_60%)]
            opacity-100 blur-[14px]
          "
        />

        <div className="relative space-y-3">
          <SessionBlock
            layoutId="session-block"
            minutes={safePayload.baseMinutes}
            liveBlocks={safePayload.liveBlocks}
            followups={safePayload.followups}
            priceEUR={breakdown.total}
            isActive
            className="mb-5 md:mb-6 relative"
            selectedDate={selectedStart}
          />

          <div className="-mx-5 md:-mx-6 h-px bg-[rgba(146,180,255,0.16)]" />

          <div className="relative min-h-[440px] md:min-h-[440px] overflow-visible pt-1">
            <AnimatePresence custom={dir} mode="wait" initial={false}>
              {step === 0 && (
                <motion.div
                  key="step-contact"
                  custom={dir}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="absolute inset-0 h-full flex flex-col"
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

              {step === 1 && (
                <motion.div
                  key="step-choose"
                  custom={dir}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="absolute inset-0 h-full flex flex-col"
                >
                  <StepChoose goBack={goBack} onChoose={(m) => chooseAndGo(m as PayMethod)} />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  custom={dir}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="absolute inset-0 h-full flex flex-col"
                >
                  <StepPayDetails
                    {...(clientSecret
                      ? ({
                          mode: "form",
                          goBack,
                          email,
                          payMethod: (payMethod || "card") as "card" | "paypal" | "revolut_pay",
                          onContinue: goNext,
                          piId,
                          stripePromise,
                          appearance: appearanceToUse,
                          clientSecret,
                          setCardPmId,
                          setSavedCard,
                          savedCard,
                        } as const)
                      : ({
                          mode: "loading",
                          goBack,
                          payMethod: (payMethod || "card") as "card" | "paypal" | "revolut_pay",
                          loadingIntent,
                          stripePromise,
                          appearance: appearanceToUse,
                          clientSecret,
                        } as const))}
                  />
                </motion.div>
              )}

              {step === 3 && clientSecret && (
                <motion.div
                  key="step-summary"
                  custom={dir}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="absolute inset-0 h-full flex flex-col"
                >
                  <Elements
                    stripe={stripePromise}
                    options={{ clientSecret, appearance: appearanceToUse, loader: "never" }}
                  >
                    <StepSummary
                      goBack={goBack}
                      payload={safePayload}
                      breakdown={breakdown}
                      payMethod={payMethod || "card"}
                      email={email}
                      piId={piId}
                      waiver={waiver}
                      setWaiver={setWaiver}
                      clientSecret={clientSecret!}
                      cardPmId={cardPmId}
                    />
                  </Elements>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer badges */}
          <div className="flex items-center gap-3 pt-4 text-white/75">
            <span className="inline-flex items-center gap-1 text-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2 3 7l9 5 9-5-9-5Z" fill="currentColor" opacity=".9" />
                <path d="M3 7v10l9 5V12L3 7Z" fill="currentColor" opacity=".65" />
                <path d="M21 7v10l-9 5V12l9-5Z" fill="currentColor" opacity=".5" />
              </svg>
              3D Secure ready
            </span>
            <span className="inline-flex items-center gap-1 text-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2 4 6v6c0 4.2 2.7 8 8 10 5.3-2 8-5.8 8-10V6l-8-4Z" fill="currentColor" />
              </svg>
              Buyer protection
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
