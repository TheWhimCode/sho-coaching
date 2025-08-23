"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import type { StripeElementsOptions, Appearance, Stripe } from "@stripe/stripe-js";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import CardForm from "./CardForm";
import type { PayMethod } from "./types";

type Props = {
  method: PayMethod;
  setMethod: (m: PayMethod) => void;

  // Stripe
  stripePromise: Promise<Stripe | null>;
  appearance: Appearance;
  clientSecret: string | null;
  loadingIntent: boolean;
  piId: string | null;

  // PayPal
  ppClientId: string;

  // Common
  payload: any;
};

export default function PaymentChooser({
  method, setMethod,
  stripePromise, appearance, clientSecret, loadingIntent, piId,
  ppClientId, payload,
}: Props) {
  const rows: Array<{ key: Exclude<PayMethod, "">; label: string; sub: string; img: string; alt: string }> = [
    { key: "card",   label: "Pay by card", sub: "Visa, Mastercard, Apple/Google Pay", img: "/images/payment/Card.png",   alt: "Card payment" },
    { key: "paypal", label: "PayPal",      sub: "Pay with your PayPal account",      img: "/images/payment/Paypal.png", alt: "PayPal" },
  ];

  return (
    <div className="space-y-3">
      {/* Collapsed rows */}
      <AnimatePresence initial={false}>
        {method === "" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="grid gap-3"
          >
            {rows.map(r => (
              <button
                key={r.key}
                onClick={() => setMethod(r.key)}
                className="flex items-center justify-between rounded-xl px-4 py-3 bg-white/[.05] hover:bg-white/[.08] ring-1 ring-white/12 text-left transition"
              >
                <div className="flex items-center gap-3">
                  <img src={r.img} alt={r.alt} className="h-6 w-12 object-contain" />
                  <div>
                    <div className="text-sm font-semibold text-white/90">{r.label}</div>
                    <div className="text-xs text-white/60">{r.sub}</div>
                  </div>
                </div>
                <span className="text-white/60">›</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pinned selector */}
      {method !== "" && (
        <div className="flex gap-2">
          {rows.map(r => (
            <button
              key={r.key}
              onClick={() => setMethod(r.key)}
              className={[
                "px-3 py-2 rounded-xl text-sm transition ring-1",
                method === r.key ? "bg-white/20 ring-white/20" : "bg-white/10 hover:bg-white/12 ring-white/10",
              ].join(" ")}
            >
              {r.key === "card" ? "Pay by card" : "PayPal"}
            </button>
          ))}
        </div>
      )}

      {/* Active panel */}
      <AnimatePresence mode="wait">
        {method === "card" && (
          <motion.div key="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {clientSecret ? (
              <Elements
                key={clientSecret}
                stripe={stripePromise}
                options={{ clientSecret, appearance, locale: "auto", loader: "auto" } as StripeElementsOptions}
              >
                <CardForm piId={piId} />
              </Elements>
            ) : (
              <div className="space-y-2">
                {loadingIntent ? (<><Shimmer/><Shimmer/><Shimmer/></>) : (<div className="text-white/80">Starting card checkout…</div>)}
              </div>
            )}
          </motion.div>
        )}

        {method === "paypal" && (
          <motion.div
            key="paypal"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-xl p-4 ring-1 ring-white/12 bg-white/[.04]"
          >
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
                  window.location.href =
                    `/checkout/success?provider=paypal&orderId=${encodeURIComponent(data.orderID)}&status=paid`;
                }}
                onError={(err) => {
                  console.error("PayPal error", err);
                  alert("PayPal payment failed.");
                }}
              />
            </PayPalScriptProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** lightweight shimmer used in the selector’s loading state */
function Shimmer() {
  return (
    <div className="relative h-10 rounded-lg ring-1 ring-white/12 bg-white/[0.05] overflow-hidden" aria-busy>
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
          mixBlendMode: "overlay",
          animation: "shimmer 1.2s linear infinite",
          transform: "translateX(-100%)",
        }}
      />
      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  );
}
