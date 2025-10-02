// src/app/checkout/_components/checkout-steps/step-components/CardForm.tsx
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

type ActivePM = "card" | "paypal" | "revolut_pay" | "klarna";

type Props = {
  piId?: string | null;
  activePm: ActivePM;
  onElementsReady?: () => void;
  onBillingCountryChange?: (code: string) => void;
  onPaymentChange?: (e: { complete: boolean }) => void;
  submitted?: boolean;
  onPostalChange?: (postal: string) => void;
};

export default function CardForm({
  activePm,
  onElementsReady,
  onBillingCountryChange,
  onPaymentChange,
  submitted = false,
  onPostalChange,
}: Props) {
  const elements = useElements();
  const [ready, setReady] = React.useState({ num: false, exp: false, cvc: false });
  const [done, setDone] = React.useState({ num: false, exp: false, cvc: false });
  const [country, setCountry] = React.useState("DE");
  const [postal, setPostal] = React.useState("");

  React.useEffect(() => {
    if (ready.num && ready.exp && ready.cvc) onElementsReady?.();
  }, [ready, onElementsReady]);

  React.useEffect(() => {
    onPaymentChange?.({ complete: done.num && done.exp && done.cvc && !!postal });
  }, [done, postal, onPaymentChange]);

  React.useEffect(() => {
    onBillingCountryChange?.(country);
  }, [country, onBillingCountryChange]);

  const okRing = "ring-white/12 focus-within:ring-white/25";
  const badRing = "ring-red-500/70 focus-within:ring-red-500";

  const rowShell =
    "mt-0.5 w-full rounded-lg bg-white/[.05] ring-1 px-4 text-base text-white/90 outline-none transition h-[48px] overflow-hidden";
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

  // Non-card PaymentElement configuration
  const paymentMethodOrder =
    activePm === "paypal"
      ? ["paypal"]
      : activePm === "revolut_pay"
      ? ["revolut_pay"]
      : activePm === "klarna"
      ? ["klarna"]
      : ["card"];

  const peOptions: StripePaymentElementOptions = {
    layout: { type: "accordion" },
    paymentMethodOrder,
    fields: { billingDetails: { email: "auto", phone: "auto", address: "auto" } },
  };

  return (
    <div className="max-w-md">
      <div className={isCard ? "min-h-[330px]" : "min-h-0"}>
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
          <div className="space-y-2">
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
            <div className="grid grid-cols-2 gap-2">
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
                        onChange={(e) => setDone((s) => ({ ...s, cvc: e.complete }))}
                      />
                    </div>
                  </div>
                </div>
              </label>
            </div>

            {/* Postal code */}
            <label className="block">
              <span className="text-xs text-white/65">Postal code</span>
              <input
                type="text"
                value={postal}
                onChange={(e) => {
                  setPostal(e.target.value);
                  onPostalChange?.(e.target.value);
                }}
                className={`mt-0.5 w-full rounded-lg bg-white/[.05] ring-1 px-4 text-base text-white/90 outline-none transition h-[48px] ${okRing}`}
                placeholder="12345"
              />
            </label>

            {/* Country */}
            <label className="block">
              <span className="text-xs text-white/65">Country</span>
              <select
                className={`mt-0.5 w-full rounded-lg bg-white/[.05] ring-1 px-4 text-base text-white/90 outline-none transition h-[48px] ${okRing}`}
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
