"use client";

import { PaymentElement } from "@stripe/react-stripe-js";
import type { StripePaymentElementOptions } from "@stripe/stripe-js";

type Props = {
  piId?: string | null;
  email?: string;
  activePm: "card" | "paypal" | "revolut_pay";
  onElementsReady?: () => void;
  /** Called with ISO country code (e.g., 'DE') when billing country changes */
  onBillingCountryChange?: (code: string) => void;
};

export default function CardForm({
  activePm,
  onElementsReady,
  onBillingCountryChange,
}: Props) {
  const peOptions: StripePaymentElementOptions = {
    layout: { type: "accordion" },
    paymentMethodOrder:
      activePm === "card" ? ["card"] : activePm === "paypal" ? ["paypal"] : ["revolut_pay"],
    fields: {
      billingDetails: { email: "never", phone: "auto", address: "auto" },
    },
    wallets: { applePay: "auto", googlePay: "auto", link: "never" as any } as any,
  };

  // Stripe's PaymentElement change event isn't fully typed for nested values;
  // we defensively read the country if present.
  function handleChange(e: any) {
    const code =
      e?.value?.billingDetails?.address?.country ??
      e?.value?.address?.country ??
      null;
    if (code) onBillingCountryChange?.(String(code).toUpperCase());
  }

  return (
    <div className="max-w-md">
      <div className="min-h-[330px]">
        <PaymentElement
          id="pe"
          options={peOptions}
          onReady={onElementsReady}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
