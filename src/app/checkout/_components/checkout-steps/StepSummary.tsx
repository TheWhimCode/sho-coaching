// src/pages/customization/checkout/rcolumn/checkoutSteps/StepSummary.tsx
"use client";

import { useEffect, useState } from "react";
import { useElements, useStripe } from "@stripe/react-stripe-js";
import type { Breakdown } from "@/lib/checkout/buildBreakdown";
import CardForm from "@/app/checkout/_components/checkout-steps/step-components/CardForm";
import { ArrowLeft } from "lucide-react";

type Method = "card" | "paypal" | "revolut_pay";

type Props = {
  goBack: () => void;
  payload: {
    baseMinutes: number;
    liveBlocks: number; // each block = 45 min
    followups: number;
  };
  breakdown: Breakdown;
  payMethod: Method;
  email: string;
  piId?: string | null;

  // consent props
  waiver: boolean;
  setWaiver: (v: boolean) => void;

  // NEW: needed to confirm
  clientSecret: string;              // required on this step
  cardPmId?: string | null;          // saved PM id for cards
};

// EU country set
const EU = new Set([
  "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT",
  "LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"
]);

export default function StepSummary({
  goBack,
  payload,
  breakdown: b,
  payMethod,
  email,
  piId,
  waiver,
  setWaiver,
  clientSecret,
  cardPmId,
}: Props) {
  const inGameMinutes = payload.liveBlocks * 45;

  const [isEU, setIsEU] = useState<boolean | null>(null);

  // Initial geo guess
  useEffect(() => {
    fetch("/api/geo")
      .then((r) => r.json())
      .then(({ country }) => {
        if (country) setIsEU(EU.has(country.toUpperCase()));
      })
      .catch(() => setIsEU(null));
  }, []);

  return (
    <div className="h-full flex flex-col pt-2">
      {/* Step header */}
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

      {/* Keep a Payment Element mounted (hidden) for non-card methods */}
      {payMethod !== "card" && (
        <div aria-hidden className="sr-only">
          <CardForm
            piId={piId}
            email={email}
            activePm={payMethod}
            onElementsReady={() => {}}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <dl className="text-base space-y-3">
          <div className="flex items-center justify-between px-1">
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
        <div className="mt-auto pt-3 space-y-4">
          {/* VAT note only if EU */}
          {isEU && (
            <div className="px-1 text-right text-[10px] leading-tight text-white/55">
              VAT not charged under §19 UStG
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-white/10" />

          <div className="flex items-center justify-between font-semibold px-1">
            <span className="text-white">Total</span>
            <span className="text-white">€{b.total.toFixed(0)}</span>
          </div>

          {/* waiver checkbox */}
          <label className="flex items-start gap-2 text-[13px] text-white/80 px-1">
            <input
              type="checkbox"
              checked={waiver}
              onChange={(e) => setWaiver(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#fc8803]"
            />
            <span>
              I request immediate service and accept that my 14-day withdrawal right ends with full performance.
            </span>
          </label>

          <p className="text-[11px] leading-snug text-white/60 px-1 mt-[2px]">
            By clicking <span className="text-white/80 font-medium">Pay now</span>, you
            agree to our <a href="/terms" className="underline hover:text-white">Terms</a> and{" "}
            <a href="/privacy" className="underline hover:text-white">Privacy Policy</a>.
          </p>

          <div className="-mt-2">
            <PayButton
              email={email}
              disabled={!waiver}
              payMethod={payMethod}
              clientSecret={clientSecret}
              cardPmId={cardPmId ?? null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PayButton({
  email,
  disabled = false,
  payMethod,
  clientSecret,
  cardPmId,
}: {
  email: string;
  disabled?: boolean;
  payMethod: Method;
  clientSecret: string;
  cardPmId: string | null;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    if (!stripe || disabled) return;
    setSubmitting(true);
    setError(null);

    const returnUrl = `${window.location.origin}/checkout/success`;

    try {
      if (payMethod === "card") {
        if (!cardPmId) {
          setError("Card details are missing.");
          setSubmitting(false);
          return;
        }

        const { error, paymentIntent } = await stripe.confirmPayment({
          clientSecret,
          confirmParams: {
            return_url: returnUrl,
            payment_method: cardPmId, // no Elements needed
          },
          redirect: "if_required",
        });

        if (error) {
          setError(error.message ?? "Payment failed");
          setSubmitting(false);
          return;
        }

        if (paymentIntent?.status === "succeeded") {
          window.location.href =
            `/checkout/success?provider=stripe&payment_intent=${encodeURIComponent(
              paymentIntent.id
            )}&redirect_status=succeeded`;
          return;
        }

        setSubmitting(false);
        return;
      }

      // ---- PayPal / Revolut Pay path (needs a mounted Payment Element) ----
      if (!elements) {
        setError("Payment form not ready.");
        setSubmitting(false);
        return;
      }

      // Validate wallet element then confirm
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message ?? "Please complete the required payment details.");
        setSubmitting(false);
        return;
      }

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          payment_method_data: { billing_details: { email: email || undefined } },
        },
      });

      if (error) {
        setError(error.message ?? "Payment failed");
        setSubmitting(false);
        return;
      }

      // For wallets, Stripe may redirect; if not, we’re done.
      setSubmitting(false);
    } catch (e: any) {
      setError(e?.message ?? "Payment failed");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        disabled={disabled || !stripe || submitting}
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
