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
import { AnimatePresence, motion } from "framer-motion";
import SessionBlock from "@/components/SessionBlock";
import { computePriceEUR } from "@/lib/pricing";

/* ===================
   Types
   =================== */
type PayMethod = "" | "card" | "paypal";

/* ===================
   Stripe/PayPal setup
   =================== */
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const ppClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!;

/* Pricing breakdown derived from computePriceEUR ladder */
function ladderBreakdown(liveMinutes: number, followups: number, liveBlocks: number) {
  const baseEUR = 40;                 // base at 60m
  const diffMin = liveMinutes - 60;   // can be negative
  const steps = diffMin / 15;         // 15m steps
  const extraEUR = steps * 10;        // ± €10 per step
  const followupsEUR = followups * 15;
  const { priceEUR: total } = computePriceEUR(liveMinutes, followups);

  const extraLabel =
    diffMin === 0
      ? "Extra time"
      : `Extra time (${diffMin > 0 ? "+" : ""}${diffMin} min${liveBlocks ? " incl. in-game" : ""})`;

  return { baseEUR, extraEUR, extraLabel, followupsEUR, total };
}

const appearance: Appearance = {
  theme: "night",
  labels: "floating",
  variables: {
    spacingUnit: "6px",
    borderRadius: "10px",
    colorPrimary: "#69A8FF",
    colorText: "rgba(255,255,255,0.92)",
    colorTextSecondary: "rgba(255,255,255,0.65)",
  },
  rules: {
    ".Input": {
      padding: "10px 12px",
      backgroundColor: "rgba(255,255,255,0.04)",
      borderColor: "rgba(146,180,255,0.18)",
      boxShadow: "none",
    },
    ".Input:focus": { borderColor: "rgba(105,168,255,0.5)" },
    ".Tab, .Block": {
      padding: "10px 12px",
      backgroundColor: "rgba(255,255,255,0.03)",
      borderColor: "rgba(146,180,255,0.18)",
    },
    ".Label": { fontSize: "13px", color: "rgba(255,255,255,0.75)" },
  },
};

/* ===================
   Tiny SVG icons
   =================== */
function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 10v7M12 7.5h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" {...props}>
      <path d="M12 3l7 3v5c0 4.5-3.1 8.2-7 9-3.9-.8-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 10V8a4 4 0 118 0v2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

/* ===================
   UI bits
   =================== */
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

/* ===================
   Left column card
   =================== */
function UsefulToKnow() {
  return (
    <aside className="relative rounded-2xl p-6 md:p-7 backdrop-blur-md bg-[#0B1220]/80 ring-1 ring-[rgba(146,180,255,.18)]">
      <div className="mb-3">
        <div className="text-xs uppercase tracking-wider text-[#8FB8E6]/90">Before you pay</div>
        <h2 className="mt-1 font-bold text-2xl text-white">Useful to know</h2>
      </div>

      <ul className="space-y-4 text-[15px] text-white/90">
        <li className="flex gap-3">
          <ShieldIcon className="mt-0.5 text-[#8FB8E6]" />
          <div>
            <div className="font-semibold">Refunds & Rescheduling</div>
            <p className="text-white/70 text-sm">Free reschedule up to 24h before the session. Full refunds if I have to cancel.</p>
          </div>
        </li>
        <li className="flex gap-3">
          <ClockIcon className="mt-0.5 text-[#8FB8E6]" />
          <div>
            <div className="font-semibold">What happens next?</div>
            <p className="text-white/70 text-sm">You&apos;ll get an email confirmation with the booking details and a Discord add within a few hours.</p>
          </div>
        </li>
        <li className="flex gap-3">
          <InfoIcon className="mt-0.5 text-[#8FB8E6]" />
          <div>
            <div className="font-semibold">Privacy</div>
            <p className="text-white/70 text-sm">Payments are processed by Stripe/PayPal. I never see your full card details.</p>
          </div>
        </li>
      </ul>

      <p className="mt-5 text-[13px] text-white/60">Questions? DM me on Discord or reply to the confirmation email.</p>

      <span className="pointer-events-none absolute -inset-3 -z-10 rounded-[24px] opacity-20 blur-2xl bg-[radial-gradient(70%_50%_at_0%_0%,_rgba(148,182,255,.25),_transparent_60%)]" />
    </aside>
  );
}

/* ===================
   Stripe Card Form
   =================== */
function CardForm({ piId }: { piId?: string | null }) {
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
      <PaymentElement options={{ fields: { billingDetails: { address: "never" } }, layout: { type: "tabs" } }} />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        disabled={!stripe || submitting}
        className="relative w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A] bg-[#fc8803] hover:bg-[#f8a81a] transition shadow-[0_10px_28px_rgba(245,158,11,.35)] ring-1 ring-[rgba(255,190,80,.55)]"
      >
        {submitting ? "Processing…" : "Pay now"}
      </button>
      <p className="text-xs text-white/70 flex items-center gap-2">
        <LockIcon /> Secure checkout (Stripe)
      </p>
    </form>
  );
}

/* ===================
   Payment chooser (rows + panel)
   =================== */
function PaymentChooser({
  method, setMethod, clientSecret, loadingIntent, piId, payload, ppClientId,
}: {
  method: PayMethod;
  setMethod: (m: PayMethod) => void;
  clientSecret: string | null;
  loadingIntent: boolean;
  piId: string | null;
  payload: any;
  ppClientId: string;
}) {
  const rows: Array<{ key: Exclude<PayMethod, "">; label: string; sub: string }> = [
    { key: "card",   label: "Pay by card", sub: "Visa, Mastercard, Apple/Google Pay" },
    { key: "paypal", label: "PayPal",      sub: "Pay with your PayPal account" },
  ];

  return (
    <div className="space-y-3">
      {/* collapsed list */}
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
                  <img
                    src={r.key === "card" ? "/images/payment/Card.png" : "/images/payment/Paypal.png"}
                    alt={r.key === "card" ? "Card payment" : "PayPal"}
                    className="h-6 w-12 object-contain"
                  />
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

      {/* pinned selector */}
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

      {/* active panel */}
      <AnimatePresence mode="wait">
        {method === "card" && (
          <motion.div key="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {clientSecret ? (
              <Elements
                key={clientSecret}
                stripe={stripePromise}
                options={{ clientSecret, appearance, locale: "auto", loader: "auto" }}
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
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

/* ===================
   Collapsible order summary (before payment)
   =================== */
function SummaryCard({
  collapsed, onConfirm, onEdit, payload, breakdown,
}: {
  collapsed: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  payload: any;
  breakdown: ReturnType<typeof ladderBreakdown>;
}) {
  return (
    <AnimatePresence initial={false}>
      {!collapsed && (
        <motion.div
          key="summary"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="rounded-xl p-4 ring-1 ring-white/12 bg-white/[.04] space-y-3"
        >
          <div className="text-sm text-white/80">Order summary</div>

          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-white/70">Base (60 min)</dt>
              <dd className="text-white/90">€{breakdown.baseEUR}</dd>
            </div>

            {breakdown.extraEUR !== 0 && (
              <div className="flex justify-between">
                <dt className="text-white/70">{breakdown.extraLabel}</dt>
                <dd className="text-white/90">
                  {breakdown.extraEUR > 0 ? "€" : "−€"}
                  {Math.abs(breakdown.extraEUR)}
                </dd>
              </div>
            )}

            {payload.followups > 0 && (
              <div className="flex justify-between">
                <dt className="text-white/70">{payload.followups}× Follow-up</dt>
                <dd className="text-white/90">€{breakdown.followupsEUR}</dd>
              </div>
            )}
          </dl>

          <div className="h-px bg-white/10" />

          <div className="flex justify-between text-[15px] font-semibold">
            <div className="text-white/80">Total</div>
            <div className="text-white">€{breakdown.total}</div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onConfirm}
              className="flex-1 rounded-xl px-4 py-2 font-semibold text-[#0A0A0A] bg-[#fc8803] hover:bg-[#f8a81a] transition ring-1 ring-[rgba(255,190,80,.55)]"
            >
              Confirm & continue
            </button>
            <button
              onClick={onEdit}
              className="rounded-xl px-4 py-2 text-sm text-white/80 bg-white/10 hover:bg-white/12 ring-1 ring-white/12"
            >
              Edit
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ===================
   Main component
   =================== */
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

  const breakdown = useMemo(
    () => ladderBreakdown(payload.liveMinutes, payload.followups, payload.liveBlocks),
    [payload.liveMinutes, payload.followups, payload.liveBlocks]
  );

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [piId, setPiId] = useState<string | null>(null);
  const [method, setMethod] = useState<PayMethod>("");
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);

  // Create Stripe PI only when card method is chosen
  useEffect(() => {
    if (method !== "card") return;
    let on = true;
    (async () => {
      setLoadingIntent(true);
      try {
        const res = await fetch("/api/stripe/checkout/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, priceEUR: breakdown.total }),
        });
        const data = await res.json().catch(() => ({}));
        if (!on) return;
        if (res.ok && data?.clientSecret) {
          setClientSecret(data.clientSecret);
          const id = String(data.clientSecret).split("_secret")[0];
          setPiId(id);
        } else {
          console.error("INTENT_FAIL", data);
        }
      } finally {
        if (on) setLoadingIntent(false);
      }
    })();
    return () => { on = false; };
  }, [payload, method, breakdown.total]);

  return (
    <section className="relative isolate py-8 md:py-10">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 hud-grid" />
        <div className="absolute inset-0 noise" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 md:px-8">
        <header className="mb-5 md:mb-7">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">Checkout</h1>
          <p className="mt-1 text-white/70">Complete your booking securely.</p>
        </header>

        <div className="grid lg:grid-cols-[1.1fr_auto_.9fr] gap-8 items-center min-h-[70vh]">
          {/* Left */}
          <div className="relative"><UsefulToKnow /></div>

          {/* Divider */}
          <div className="hidden lg:flex items-stretch mx-2 px-4">
            <div className="w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
          </div>

          {/* Right */}
          <div className="w-full max-w-xl lg:justify-self-end">
            <div className="rounded-2xl p-5 md:p-6 backdrop-blur-md bg-[#0B1220]/80 ring-1 ring-[rgba(146,180,255,.18)] space-y-4">
              {/* Session preview w/ total price */}
              <SessionBlock
                layoutId="session-block"
                minutes={payload.liveMinutes}
                priceEUR={breakdown.total}
                followups={payload.followups}
                liveBlocks={payload.liveBlocks}
                className="mb-2"
              />

              {/* Collapsible summary */}
              <SummaryCard
                collapsed={summaryCollapsed}
                onConfirm={() => setSummaryCollapsed(true)}
                onEdit={() => setSummaryCollapsed(false)}
                payload={payload}
                breakdown={breakdown}
              />

              {/* Payment only after confirm */}
              {summaryCollapsed && (
                <PaymentChooser
                  method={method}
                  setMethod={setMethod}
                  clientSecret={clientSecret}
                  loadingIntent={loadingIntent}
                  piId={piId}
                  payload={{ ...payload, priceEUR: breakdown.total }}
                  ppClientId={ppClientId}
                />
              )}

              {/* Trust badges */}
              <div className="flex items-center gap-3 pt-1">
                <span className="inline-flex items-center gap-2 text-xs text-white/70"><LockIcon /> 3D Secure ready</span>
                <span className="inline-flex items-center gap-2 text-xs text-white/70"><ShieldIcon /> Buyer protection</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
