"use client";

import { useEffect, useRef, useState } from "react";
import { useElements, useStripe } from "@stripe/react-stripe-js";
import type { Breakdown } from "@/lib/checkout/buildBreakdown";
import CardForm from "@/app/checkout/_components/checkout-steps/step-components/CardForm";
import { ArrowLeft } from "lucide-react";
import { useFooter } from "@/app/checkout/_components/checkout-steps/FooterContext";

type Method = "card" | "paypal" | "revolut_pay" | "klarna";

type Props = {
  goBack: () => void;
  payload: { baseMinutes: number; liveBlocks: number; followups: number };
  breakdown: Breakdown;
  payMethod: Method;
  clientSecret: string;
  // If you want to support card confirm here, pass this in and uncomment the marked block:
  // cardPmId?: string | null;
};

export default function StepSummary({
  goBack,
  payload,
  breakdown: b,
  payMethod,
  clientSecret,
  // cardPmId,
}: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [, setFooter] = useFooter();

  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handlePay() {
    if (!stripe || submitting) return;

    setSubmitting(true);
    setErr(null);

    const returnUrl = `${window.location.origin}/checkout/success`;

    try {
      if (payMethod !== "card") {
        // Non-card methods: confirm via Payment Element
        if (!elements) {
          setErr("Payment form not ready.");
          setSubmitting(false);
          return;
        }

        // Let provider UIs validate/collect details
        const { error: submitError } = await elements.submit();
        if (submitError) {
          setErr(submitError.message ?? "Please complete the required payment details.");
          setSubmitting(false);
          return;
        }

        const res = await stripe.confirmPayment({
          elements,
          clientSecret,
          confirmParams: { return_url: returnUrl },
        });

        if ((res as any).error) {
          const e = (res as any).error;
          setErr(e?.message ?? "Payment failed");
          setSubmitting(false);
          return;
        }

        // For redirecting methods, Stripe will navigate away automatically.
        setSubmitting(false);
        return;
      }

      // --- Card flow (requires cardPmId like before) ---
      // if (cardPmId) {
      //   const result = await stripe.confirmPayment({
      //     clientSecret,
      //     confirmParams: { return_url: returnUrl, payment_method: cardPmId },
      //   });
      //   if ((result as any).error) {
      //     const e = (result as any).error;
      //     setErr(e?.message ?? "Payment failed");
      //     setSubmitting(false);
      //     return;
      //   }
      //   setSubmitting(false);
      //   return;
      // } else {
      //   setErr("Card details are missing.");
      //   setSubmitting(false);
      //   return;
      // }

      // If you reach here with card selected but no cardPmId handling, block and explain:
      setErr("Card confirmation is not wired in this step. Pass cardPmId and enable the card flow block.");
      setSubmitting(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg ?? "Payment failed");
      setSubmitting(false);
    }
  }

  // Publish footer (direct handler; no requestSubmit indirection)
  useEffect(() => {
    setFooter({
      label: submitting ? "Processing…" : "Pay now",
      disabled: !stripe || submitting,
      loading: submitting,
      onClick: () => {
        if (!stripe || submitting) return;
        void handlePay();
      },
      hidden: false,
    });
  }, [setFooter, stripe, submitting, payMethod, clientSecret]);

  return (
    <div className="flex flex-col h-full md:pt-2">
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
          <div className="text-sm text-white/80">Order summary</div>
        </div>
        <div className="mt-2 border-t border-white/10" />
      </div>

      {/* Scrollable list */}
      <form
        ref={formRef}
        className="flex-1 min-h-0 overflow-y-auto px-1 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!stripe || submitting) return;
          void handlePay();
        }}
      >
        <dl className="text-base space-y-3">
          <div className="flex items-center justify-between">
            <dt className="text-white/80">⬩ {payload.baseMinutes} min coaching</dt>
            <dd className="text-white/90">€{b.minutesEUR.toFixed(0)}</dd>
          </div>

          {payload.liveBlocks > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-white/80">⬩ {payload.liveBlocks * 45} min in-game coaching</dt>
              <dd className="text-white/90">€{b.inGameEUR.toFixed(0)}</dd>
            </div>
          )}

          {payload.followups > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-white/80">⬩ {payload.followups}× Follow-up</dt>
              <dd className="text-white/90">€{b.followupsEUR.toFixed(0)}</dd>
            </div>
          )}
        </dl>

        {/* Keep a Payment Element mounted (hidden) for non-card methods */}
        {payMethod !== "card" && (
          <div aria-hidden className="sr-only">
            <CardForm activePm={payMethod} onElementsReady={() => {}} />
          </div>
        )}

        {/* Screen-reader error; CTA is in the parent footer */}
        {err && <p className="sr-only">{err}</p>}
      </form>
    </div>
  );
}
