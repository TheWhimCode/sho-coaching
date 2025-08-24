"use client";

import { useState } from "react";
import { useElements, useStripe } from "@stripe/react-stripe-js";
import CardForm from "@/components/checkout/CardForm";
import type { Breakdown } from "@/components/checkout/buildBreakdown";

type Props = {
  goBack: () => void;
  waiver: boolean;
  setWaiver: (v: boolean) => void;
  payload: {
    baseMinutes: number;
    liveBlocks: number; // each block = 45 min
    followups: number;
  };
  breakdown: Breakdown; // { minutesEUR, inGameEUR, followupsEUR, total }
  payMethod: "card" | "paypal" | "revolut_pay";
  email: string;
  piId?: string | null;
};

export default function StepSummary({
  goBack,
  waiver,
  setWaiver,
  payload,
  breakdown: b,
  payMethod,
  email,
  piId,
}: Props) {
  const inGameMinutes = payload.liveBlocks * 45;

  return (
    <div className="h-full flex flex-col rounded-xl p-4 ring-1 ring-white/12 bg-white/[.04]">
      {/* Step header */}
      <div className="mb-3">
        <div className="relative h-7 flex items-center justify-center">
          <button
            onClick={goBack}
            className="absolute left-0 text-sm text-white/80 hover:text-white"
          >
            ← Back
          </button>
          <div className="text-sm text-white/80">Order summary</div>
        </div>
        <div className="mt-2 border-t border-white/10" />
      </div>

      {/* Keep PaymentElement mounted (hidden) so confirmPayment works */}
      <div className="sr-only">
        <CardForm
          piId={piId}
          email={email}
          activePm={payMethod}
          onElementsReady={() => {}}
        />
      </div>

      {/* Main breakdown */}
      <div className="flex-1 flex flex-col">
        <dl className="text-base space-y-0">
          <div className="flex items-center justify-between px-1 py-3">
            <dt className="text-white/80">⬩ {payload.baseMinutes} min coaching</dt>
            <dd className="text-white/90">€{b.minutesEUR.toFixed(0)}</dd>
          </div>

          {payload.liveBlocks > 0 && (
            <div className="flex items-center justify-between px-1">
              <dt className="text-white/80">⬩ {inGameMinutes} min in-game coaching</dt>
              <dd className="text-white/90">€{b.inGameEUR.toFixed(0)}</dd>
            </div>
          )}

          {payload.followups > 0 && (
            <div className="flex items-center justify-between px-1">
              <dt className="text-white/80">⬩ {payload.followups}× Follow-up</dt>
              <dd className="text-white/90">€{b.followupsEUR.toFixed(0)}</dd>
            </div>
          )}
        </dl>

        {/* Bottom section pinned down */}
        <div className="mt-auto pt-3 border-t border-white/10 space-y-4">
          <div className="flex items-center justify-between font-semibold px-1">
            <span className="text-white">Total</span>
            <span className="text-white">€{b.total.toFixed(0)}</span>
          </div>

          <label className="flex items-start gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={waiver}
              onChange={(e) => setWaiver(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[#fc8803]"
            />
            <span>
              I agree to waive my 14-day withdrawal right so that Sho can start delivering
              immediately.
            </span>
          </label>

          <PayButton disabled={!waiver} email={email} />
        </div>
      </div>
    </div>
  );
}

function PayButton({ disabled, email }: { disabled: boolean; email: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const returnUrl = `${window.location.origin}/checkout/success`;
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: { billing_details: { email: email || undefined } },
      },
      redirect: "if_required",
    });

    if (error) {
      setError(error.message ?? "Payment failed");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      window.location.href = `/checkout/success?provider=stripe&payment_intent=${encodeURIComponent(
        paymentIntent.id
      )}&redirect_status=succeeded`;
      return;
    }

    setSubmitting(false);
  }

  return (
    <div>
      <button
        disabled={disabled || !stripe || !elements || submitting}
        onClick={handlePay}
        className="w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A]
                 bg-[#fc8803] hover:bg-[#f8a81a] transition
                 shadow-[0_10px_28px_rgba(245,158,11,.35)]
                 ring-1 ring-[rgba(255,190,80,.55)]
                 disabled:opacity-50"
      >
        {submitting ? "Processing…" : "Pay now"}
      </button>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  );
}
