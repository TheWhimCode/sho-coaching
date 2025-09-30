// src/pages/customization/checkout/rcolumn/CheckoutPanel.tsx
"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import type { Appearance, Stripe } from "@stripe/stripe-js";
import dynamic from "next/dynamic";

import SessionBlock from "@/app/coaching/[preset]/_hero-components/SessionBlock";
import type { Breakdown } from "@/lib/checkout/buildBreakdown";

// Steps
import StepContact from "./checkout-steps/StepContact";
import StepChoose from "./checkout-steps/StepChoose";
const StepPayDetails = dynamic(() => import("./checkout-steps/StepPayDetails"), { ssr: false });
import StepSummary from "./checkout-steps/StepSummary";

import { appearanceDarkBrand } from "@/lib/checkout/stripeAppearance";
import { getPreset } from "@/lib/sessions/preset";

type PayMethod = "" | "card" | "paypal" | "revolut_pay" | "klarna";

type Payload = {
  slotId: string;
  sessionType: string;
  baseMinutes: number;
  liveMinutes: number;
  followups: number;
  liveBlocks: number;
  preset: string;
  holdKey: string;
  startTime?: string | number;
};

type PayloadForBackend = Pick<
  Payload,
  "slotId" | "sessionType" | "liveMinutes" | "followups" | "liveBlocks" | "preset" | "holdKey"
> & {
  startTime?: string | number | Date;
};

type Props = {
  payload: Payload;
  breakdown: Breakdown;
  stripePromise: Promise<Stripe | null>;
  appearance?: Appearance;
  payloadForBackend: PayloadForBackend;
};

const DEFAULT_PAYLOAD: Payload = {
  slotId: "",
  sessionType: "",
  baseMinutes: 60,
  liveMinutes: 60,
  followups: 0,
  liveBlocks: 0,
  preset: "",
  holdKey: "",
};

type SavedCard = {
  id: string;
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
};

type DiscordIdentity = {
  id: string;
  username?: string | null;
  globalName?: string | null;
};

export default function CheckoutPanel({
  payload,
  breakdown,
  stripePromise,
  appearance: appearanceProp,
  payloadForBackend,
}: Props) {
  const appearanceToUse = appearanceProp ?? appearanceDarkBrand;
  const safePayload: Payload = useMemo(() => ({ ...DEFAULT_PAYLOAD, ...payload }), [payload]);

  const sessionBlockTitle = useMemo(() => {
    const p = getPreset(safePayload.baseMinutes, safePayload.followups, safePayload.liveBlocks);
    return p === "vod"
      ? "VOD Review"
      : p === "instant"
      ? "Instant Insight"
      : p === "signature"
      ? "Signature Session"
      : "Custom Session";
  }, [safePayload.baseMinutes, safePayload.followups, safePayload.liveBlocks]);

  const totalLiveMinutes = useMemo(
    () => safePayload.baseMinutes + safePayload.liveBlocks * 45,
    [safePayload.baseMinutes, safePayload.liveBlocks]
  );

  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const goNext = () => {
    setDir(1);
    setStep((s) => (s === 3 ? 3 : ((s + 1) as 0 | 1 | 2 | 3)));
  };
  const goBack = () => {
    setDir(-1);
    setStep((s) => (s === 0 ? 0 : ((s - 1) as 0 | 1 | 2 | 3)));
  };

  // Payment/intent state
  const [payMethod, setPayMethod] = useState<PayMethod>("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [piId, setPiId] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const [cardPmId, setCardPmId] = useState<string | null>(null);
  const [savedCard, setSavedCard] = useState<SavedCard | null>(null);

  // Contact state
  const [riotTag, setRiotTag] = useState("");
  const [notes, setNotes] = useState("");
  const [discordIdentity, setDiscordIdentity] = useState<DiscordIdentity | null>(null);
  const [contactErr, setContactErr] = useState<string | null>(null);
  const riotRef = useRef<HTMLInputElement>(null);

  const discordDisplay = useMemo(
    () => discordIdentity?.globalName || discordIdentity?.username || "",
    [discordIdentity]
  );

  const currentMethodRef = useRef<PayMethod>("");
  const [waiver, setWaiver] = useState(false);

  async function chooseAndGo(m: PayMethod) {
    if (!m) return;
    setDir(1);
    setPayMethod(m);
    currentMethodRef.current = m;

    // Reset Stripe state ONLY when the user changes the method
    setClientSecret(null);
    setPiId(null);
    setCardPmId(null);
    setSavedCard(null);

    setStep(2);
    setLoadingIntent(true);

    try {
      let bid = bookingId;

      // Create the booking once
      if (!bid) {
        const make = await fetch("/api/booking/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionType: sessionBlockTitle,
            slotId: safePayload.slotId,
            liveMinutes: totalLiveMinutes,
            followups: safePayload.followups,
            riotTag,
            discordId: discordIdentity?.id ?? null,
            discordName: discordDisplay || null,
            notes,
            waiverAccepted: waiver,
          }),
        });

        if (!make.ok) {
          console.error("CREATE_BOOKING_FAILED", await make.json().catch(() => ({})));
          setLoadingIntent(false);
          return;
        }

        const j = await make.json();
        bid = j.bookingId as string;
        setBookingId(bid);

        // Optional: persist Discord link to the booking/user immediately
        if (discordIdentity?.id) {
          await fetch("/api/booking/attach-discord", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId: j.bookingId,
              discordId: discordIdentity.id,
              discordName: discordDisplay || null,
            }),
          }).catch(() => {});
        }
      }

      // Create a PI for this booking & method
      const res = await fetch("/api/stripe/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bid,
          payMethod: m,
        }),
      });

      if (res.status === 409) {
        console.warn(
          "Selected start time can’t fit this duration. Choose another start or shorten the session."
        );
        setStep(0);
        setLoadingIntent(false);
        return;
      }

      const data = await res.json().catch(() => ({} as any));
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

  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  useEffect(() => {
    function coerceToDate(v: unknown): Date | null {
      if (v == null) return null;
      if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
      if (typeof v === "number") {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
      }
      if (typeof v === "string") {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
      }
      return null;
    }

    const fromPayloadBackend = coerceToDate(payloadForBackend?.startTime);
    const fromPayload = coerceToDate(safePayload.startTime);

    if (fromPayloadBackend) {
      setSelectedStart(fromPayloadBackend);
      return;
    }
    if (fromPayload) {
      setSelectedStart(fromPayload);
      return;
    }

    if (typeof window !== "undefined") {
      const s = new URLSearchParams(window.location.search).get("startTime");
      const fromQuery = coerceToDate(s || undefined);
      if (fromQuery) setSelectedStart(fromQuery);
    }
  }, [payloadForBackend, safePayload]);

  // Handle Discord OAuth success from StepContact
  const handleDiscordLinked = async (u: DiscordIdentity) => {
    setDiscordIdentity(u);

    if (bookingId) {
      await fetch("/api/booking/attach-discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          discordId: u.id,
          discordName: u.globalName || u.username || null,
        }),
      }).catch(() => {});
    }
  };

  return (
    <div className="relative rounded-2xl isolate w-full">
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
            priceEUR={breakdown?.total ?? 0}
            isActive
            className="mb-5 md:mb-6 relative"
            selectedDate={selectedStart}
          />

          <div className="-mx-5 md:-mx-6 h-px bg-[rgba(146,180,255,0.16)]" />

          <div className="relative min-h-[440px] overflow-visible pt-1 md:min-h-[440px]">
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
                  className="relative flex flex-col w-full md:absolute md:inset-0 md:h-full"
                >
                  <StepContact
                    riotTag={riotTag}
                    notes={notes}
                    setRiotTag={setRiotTag}
                    setNotes={setNotes}
                    onDiscordLinked={handleDiscordLinked}
                    discordIdentity={discordIdentity}
                    contactErr={contactErr}
                    riotInputRef={riotRef}
                    onSubmit={() => {
                      setContactErr(null);
                      goNext();
                    }}
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
                  className="relative flex flex-col w-full md:absolute md:inset-0 md:h-full"
                >
                  <Elements
                    stripe={stripePromise}
                    options={{ appearance: appearanceToUse, loader: "never" }}
                  >
                    <StepChoose goBack={goBack} onChoose={(m) => chooseAndGo(m as PayMethod)} />
                  </Elements>
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
                  className="relative flex flex-col w-full md:absolute md:inset-0 md:h-full"
                >
                  {clientSecret ? (
                    <Elements
                      key={clientSecret || "loading-step2"}
                      stripe={stripePromise}
                      options={{ clientSecret, appearance: appearanceToUse, loader: "never" }}
                    >
                      <StepPayDetails
                        mode="form"
                        goBack={goBack}
                        payMethod={(payMethod || "card") as Exclude<PayMethod, "">}
                        onContinue={goNext}
                        piId={piId}
                        setCardPmId={setCardPmId}
                        setSavedCard={setSavedCard}
                        savedCard={savedCard}
                      />
                    </Elements>
                  ) : (
                    <StepPayDetails
                      mode="loading"
                      goBack={goBack}
                      payMethod={(payMethod || "card") as Exclude<PayMethod, "">}
                      loadingIntent={loadingIntent}
                    />
                  )}
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
                  className="relative flex flex-col w-full md:absolute md:inset-0 md:h-full"
                >
                  <Elements
                    key={clientSecret || "loading-step3"}
                    stripe={stripePromise}
                    options={{ clientSecret, appearance: appearanceToUse, loader: "never" }}
                  >
                    <StepSummary
                      goBack={goBack}
                      payload={safePayload}
                      breakdown={breakdown}
                      payMethod={(payMethod || "card") as Exclude<PayMethod, "">}
                      discord={discordDisplay}
                      notes={notes}
                      sessionType={sessionBlockTitle}
                      piId={piId}
                      waiver={waiver}
                      setWaiver={setWaiver}
                      clientSecret={clientSecret!}
                      cardPmId={cardPmId}
                      bookingId={bookingId}
                    />
                  </Elements>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3 pt-4 text-white/75">
            <span className="inline-flex items-center gap-1 text-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="text-violet-400">
                <path d="M12 2 3 7l9 5 9-5-9-5Z" fill="currentColor" opacity=".9" />
                <path d="M3 7v10l9 5V12L3 7Z" fill="currentColor" opacity=".65" />
                <path d="M21 7v10l-9 5V12l9-5Z" fill="currentColor" opacity=".5" />
              </svg>
              3D Secure ready
            </span>

            <span className="inline-flex items-center gap-1 text-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="text-blue-400">
                <path d="M12 2 4 6v6c0 4.2 2.7 8 8 10 5.3-2 8-5.8 8-10V6l-8-4Z" fill="currentColor" />
              </svg>
              Buyer protection
            </span>
          </div>
        </div>
      </div>
    </div>
    /* CLOSE outer wrapper */
  );
}
