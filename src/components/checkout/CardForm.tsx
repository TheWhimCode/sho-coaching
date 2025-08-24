"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { StripePaymentElementOptions } from "@stripe/stripe-js";

type Props = {
  piId?: string | null;
  email?: string;
  activePm: "card" | "paypal" | "revolut_pay";
};

export default function CardForm({ piId, email, activePm }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peOptions: StripePaymentElementOptions = {
    // With a single pm type, no tabs will render; accordion keeps it clean.
    layout: { type: "accordion" },
    paymentMethodOrder:
      activePm === "card" ? ["card"] :
      activePm === "paypal" ? ["paypal"] :
      ["revolut_pay"],
    fields: {
      billingDetails: {
        email: "never", // collected in step 1
        phone: "never",
        address: activePm === "card" ? "auto" : "never",
      },
    },
    wallets: {
      applePay: "auto",
      googlePay: "auto",
      link: "never" as any,
    } as any,
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const returnUrl = `${window.location.origin}/checkout/success`;
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: {
          billing_details: { email: email || undefined },
        },
      },
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
      <PaymentElement id="pe" options={peOptions} />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        disabled={!stripe || submitting}
        className="relative w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A]
                   bg-[#fc8803] hover:bg-[#f8a81a] transition
                   shadow-[0_10px_28px_rgba(245,158,11,.35)]
                   ring-1 ring-[rgba(255,190,80,.55)]"
      >
        {submitting ? "Processing…" : "Pay now"}
      </button>

      <p className="text-xs text-white/70">Secure checkout (Stripe)</p>
    </form>
  );
}
