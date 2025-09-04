"use client";

import {
  PaymentElement,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useElements,
} from "@stripe/react-stripe-js";
import type {
  StripeCardElementOptions,
  StripePaymentElementOptions,
  StripeCardExpiryElement,
  StripeCardCvcElement,
  StripePaymentElementChangeEvent,
} from "@stripe/stripe-js";
import * as React from "react";

type Props = {
  piId?: string | null;
  email?: string;
  activePm: "card" | "paypal" | "revolut_pay";
  onElementsReady?: () => void;
  onBillingCountryChange?: (code: string) => void;
  onPaymentChange?: (e: { complete: boolean }) => void;
  submitted?: boolean;
};

export default function CardForm({
  activePm,
  onElementsReady,
  onBillingCountryChange,
  onPaymentChange,
  submitted = false,
}: Props) {
  // Always call hooks (no conditional returns before this point)
  const elements = useElements();
  const [ready, setReady] = React.useState({ num: false, exp: false, cvc: false });
  const [done, setDone] = React.useState({ num: false, exp: false, cvc: false });
  const [country, setCountry] = React.useState("DE");

  React.useEffect(() => {
    if (ready.num && ready.exp && ready.cvc) onElementsReady?.();
  }, [ready, onElementsReady]);

  React.useEffect(() => {
    onPaymentChange?.({ complete: done.num && done.exp && done.cvc });
  }, [done, onPaymentChange]);

  React.useEffect(() => {
    onBillingCountryChange?.(country);
  }, [country, onBillingCountryChange]);

  const okRing = "ring-white/12 focus-within:ring-white/25";
  const badRing = "ring-red-500/70 focus-within:ring-red-500";

  const rowShell =
    "mt-1 w-full rounded-lg bg-white/[.05] ring-1 px-4 text-base text-white/90 outline-none transition h-[52px] overflow-hidden";
  const innerWrap = "h-full flex items-center";

  const cardStyle: StripeCardElementOptions["style"] = {
    base: {
      color: "rgba(255,255,255,0.92)",
      fontSize: "15px",
      lineHeight: "1.4",
      "::placeholder": { color: "rgba(255,255,255,0.45)" },
      iconColor: "#fc8803",
    },
    invalid: { color: "rgba(255,255,255,0.92)" },
  };

  const numberOpts: StripeCardElementOptions = { style: cardStyle };
  const expOpts: StripeCardElementOptions = { style: cardStyle };
  const cvcOpts: StripeCardElementOptions = { style: cardStyle };

  // ---- Auto-advance helpers (typed) ----
  function focusExpiry() {
    const el = elements?.getElement(CardExpiryElement) as StripeCardExpiryElement | null;
    el?.focus();
  }
  function focusCvc() {
    const el = elements?.getElement(CardCvcElement) as StripeCardCvcElement | null;
    el?.focus();
  }

  const countries = [
    { code: "DE", name: "Germany" },
    { code: "US", name: "United States" },
    { code: "GB", name: "United Kingdom" },
    { code: "FR", name: "France" },
    { code: "ES", name: "Spain" },
    { code: "IT", name: "Italy" },
    { code: "NL", name: "Netherlands" },
    { code: "SE", name: "Sweden" },
    { code: "PL", name: "Poland" },
    { code: "AT", name: "Austria" },
    { code: "CH", name: "Switzerland" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
  ];

  const isCard = activePm === "card";

  // Options for non-card PaymentElement
  const peOptions: StripePaymentElementOptions = {
    layout: { type: "accordion" },
    paymentMethodOrder: activePm === "paypal" ? ["paypal"] : ["revolut_pay"],
    fields: { billingDetails: { email: "never", phone: "auto", address: "auto" } },
    // omit `link` to avoid type friction; default behavior is fine
    wallets: { applePay: "auto", googlePay: "auto" },
  };

  return (
    <div className="max-w-md">
      <div className="min-h-[330px]">
        {!isCard ? (
          <PaymentElement
            id="pe"
            options={peOptions}
            onReady={onElementsReady}
            onChange={(e: StripePaymentElementChangeEvent) =>
              onPaymentChange?.({ complete: !!e.complete })
            }
          />
        ) : (
          <div className="space-y-3">
            {/* Card number */}
            <label className="block">
              <span className="text-xs text-white/65">Card number</span>
              <div className={`${rowShell} ${submitted && !done.num ? badRing : okRing}`}>
                <div className={innerWrap}>
                  <div className="w-full">
                    <CardNumberElement
                      options={numberOpts}
                      onReady={() => setReady((s) => ({ ...s, num: true }))}
                      onChange={(e) => {
                        setDone((s) => ({ ...s, num: e.complete }));
                        if (e.complete) focusExpiry();
                      }}
                    />
                  </div>
                </div>
              </div>
            </label>

            {/* Expiry + CVC */}
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-white/65">Expiry date</span>
                <div className={`${rowShell} ${submitted && !done.exp ? badRing : okRing}`}>
                  <div className={innerWrap}>
                    <div className="w-full">
                      <CardExpiryElement
                        options={expOpts}
                        onReady={() => setReady((s) => ({ ...s, exp: true }))}
                        onChange={(e) => {
                          setDone((s) => ({ ...s, exp: e.complete }));
                          if (e.complete) focusCvc();
                        }}
                      />
                    </div>
                  </div>
                </div>
              </label>

              <label className="block">
                <span className="text-xs text-white/65">Security code</span>
                <div className={`${rowShell} ${submitted && !done.cvc ? badRing : okRing}`}>
                  <div className={innerWrap}>
                    <div className="w-full">
                      <CardCvcElement
                        options={cvcOpts}
                        onReady={() => setReady((s) => ({ ...s, cvc: true }))}
                        onChange={(e) => setDone((s) => ({ ...s, cvc: e.complete }))} // e has .complete
                      />
                    </div>
                  </div>
                </div>
              </label>
            </div>

            {/* Country */}
            <label className="block">
              <span className="text-xs text-white/65">Country</span>
              <select
                className={`mt-1 w-full rounded-lg bg-white/[.05] ring-1 px-4 text-base text-white/90 outline-none transition h-[52px] ${okRing}`}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code} className="bg-[#151527]">
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
