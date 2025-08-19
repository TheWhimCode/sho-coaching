// app/checkout/CheckoutClient.tsx  (CLIENT)
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe, type Appearance } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
  LinkAuthenticationElement,
} from "@stripe/react-stripe-js";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const ppClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;

const appearance: Appearance = {
  theme: "night",
  labels: "floating",
  variables: {
    colorPrimary: "#69A8FF",
    colorBackground: "transparent",
    colorText: "rgba(255,255,255,0.92)",
    colorTextSecondary: "rgba(255,255,255,0.65)",
    colorDanger: "#F87171",
    borderRadius: "12px",
    fontSmooth: "always",
    spacingUnit: "8px",
  },
  rules: {
    ".Input": { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(146,180,255,0.18)", boxShadow: "none" },
    ".Input:focus": { borderColor: "rgba(105,168,255,0.5)" },
    ".Tab, .Block": { backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(146,180,255,0.18)" },
    ".Label": { color: "rgba(255,255,255,0.75)" },
  },
};

function Form() {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success`,
      },
    });
    if (error) setError(error.message ?? "Payment failed");
    setSubmitting(false);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto p-4 space-y-4">
      <LinkAuthenticationElement />
      <PaymentElement />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button disabled={!stripe || submitting} className="btn-cta w-full py-3 rounded-xl font-semibold">
        {submitting ? "Processing…" : "Pay now"}
      </button>
    </form>
  );
}

export default function CheckoutClient() {
  const sp = useSearchParams();
  const payload = useMemo(
    () => ({
      slotId: String(sp.get("slotId") ?? ""),
      sessionType: String(sp.get("sessionType") ?? "Session"),
      liveMinutes: Number(sp.get("liveMinutes") ?? 60),
      followups: Number(sp.get("followups") ?? 0),
      inGame: String(sp.get("inGame") ?? "false") === "true",
      liveBlocks: Number(sp.get("liveBlocks") ?? 0),
      discord: String(sp.get("discord") ?? ""),
      preset: String(sp.get("preset") ?? "custom"),
      holdKey: String(sp.get("holdKey") ?? ""),
    }),
    [sp]
  );

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [method, setMethod] = useState<"card" | "paypal">("card");

  useEffect(() => {
    if (method !== "card") return;
    (async () => {
      const res = await fetch("/api/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) setClientSecret(data.clientSecret);
      else console.error(data);
    })();
  }, [payload, method]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex gap-2">
        <button
          className={`px-3 py-2 rounded ${method === "card" ? "bg-white/20" : "bg-white/10"}`}
          onClick={() => setMethod("card")}
        >
          Card
        </button>
        <button
          className={`px-3 py-2 rounded ${method === "paypal" ? "bg-white/20" : "bg-white/10"}`}
          onClick={() => setMethod("paypal")}
        >
          PayPal
        </button>
      </div>

      {method === "card" ? (
        clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance, locale: "auto", loader: "auto" }}>
            <Form />
          </Elements>
        ) : (
          <div className="text-white/80">Starting card checkout…</div>
        )
      ) : (
        <PayPalScriptProvider options={{ clientId: ppClientId, currency: "EUR", intent: "capture" }}>
          <PayPalButtons
            style={{ layout: "vertical" }}
            createOrder={async () => {
              const res = await fetch("/api/paypal/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data?.error || "create_failed");
              return data.id;
            }}
            onApprove={async (data) => {
              const res = await fetch("/api/paypal/capture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: data.orderID }),
              });
              const out = await res.json();
              if (!res.ok) throw new Error(out?.error || "capture_failed");
              window.location.href = `/checkout/success?provider=paypal&orderId=${encodeURIComponent(
                data.orderID
              )}&status=paid`;
            }}
            onError={(err) => {
              console.error("PayPal error", err);
              alert("PayPal payment failed.");
            }}
          />
        </PayPalScriptProvider>
      )}
    </div>
  );
}
