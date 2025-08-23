"use client";

import { useState } from "react";
import {
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

export default function CardForm({ piId }: { piId?: string | null }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const returnUrl = `${window.location.origin}/checkout/success`;
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: "if_required",
    });

    if (error) {
      if ((error as any).code === "payment_intent_unexpected_state" && piId) {
        window.location.href =
          `/checkout/success?provider=stripe&payment_intent=${encodeURIComponent(piId)}&redirect_status=succeeded`;
      } else {
        setError(error.message ?? "Payment failed");
      }
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      window.location.href =
        `/checkout/success?provider=stripe&payment_intent=${encodeURIComponent(paymentIntent.id)}&redirect_status=succeeded`;
      return;
    }

    setSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-md">
      <LinkAuthenticationElement />
      <PaymentElement
        options={{
          fields: { billingDetails: { address: "never" } },
          layout: { type: "tabs" },
        }}
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        disabled={!stripe || submitting}
        className="relative w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A] bg-[#fc8803] hover:bg-[#f8a81a] transition shadow-[0_10px_28px_rgba(245,158,11,.35)] ring-1 ring-[rgba(255,190,80,.55)]"
      >
        {submitting ? "Processing…" : "Pay now"}
      </button>

      <p className="text-xs text-white/70 flex items-center gap-2">
        <svg viewBox="0 0 24 24" width={18} height={18} fill="none">
          <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M8 10V8a4 4 0 118 0v2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        Secure checkout (Stripe)
      </p>
    </form>
  );
}
