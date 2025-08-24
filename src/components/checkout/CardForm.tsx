"use client";

import { PaymentElement } from "@stripe/react-stripe-js";
import type { StripePaymentElementOptions } from "@stripe/stripe-js";

type Props = {
  piId?: string | null;
  email?: string;
  activePm: "card" | "paypal" | "revolut_pay";
  onElementsReady?: () => void;
};

export default function CardForm({ activePm, onElementsReady }: Props) {
  const peOptions: StripePaymentElementOptions = {
    layout: { type: "accordion" },
    paymentMethodOrder:
      activePm === "card" ? ["card"] : activePm === "paypal" ? ["paypal"] : ["revolut_pay"],
    fields: {
      billingDetails: { email: "never", phone: "auto", address: "auto"},
    },
    wallets: { applePay: "auto", googlePay: "auto", link: "never" as any } as any,
  };

  return (
    <div className="max-w-md">
      <div className="min-h-[330px]">
        <PaymentElement id="pe" options={peOptions} onReady={onElementsReady} />
      </div>
    </div>
  );
}
