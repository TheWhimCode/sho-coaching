// app/checkout/success/page.tsx
"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type BookingInfo = {
  id: string;
  sessionType: string;
  liveMinutes: number;
  followups: number;
  discord: string;
  currency: string;
  amountCents: number | null;
  startISO: string;
};

export default function SuccessPage() {
  const sp = useSearchParams();

  const provider = sp.get("provider") || "stripe";
  const orderId = sp.get("orderId") || undefined;                 // PayPal
  const redirectStatus = sp.get("redirect_status") || undefined;  // Stripe
  const intentId = sp.get("payment_intent") || undefined;         // Stripe

  const ref = useMemo(() => {
    if (provider === "paypal" && orderId) return orderId;
    if (provider === "stripe" && intentId) return intentId;
    return undefined;
  }, [provider, orderId, intentId]);

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(!!ref);
  const [err, setErr] = useState<string | null>(null);

  // Poll /api/booking/from-ref for a short while to handle webhook delay
  useEffect(() => {
    if (!ref) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 12;          // ~12s total
    let delay = 1000;                 // start at 1s, grow slightly

    const tick = async () => {
      if (cancelled || attempts >= maxAttempts) {
        if (!cancelled && !booking) setErr("Still finalizing your booking. Please refresh in a moment.");
        setLoading(false);
        return;
      }
      attempts += 1;

      try {
        const res = await fetch(`/api/booking/from-ref?ref=${encodeURIComponent(ref)}`, { cache: "no-store" });
        if (res.status === 404) {
          // not in DB yet → wait and try again
          setLoading(true);
        } else if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          // treat known not_found as retry, others as errors
          if (j?.error === "not_found") {
            setLoading(true);
          } else {
            throw new Error(j?.error || `lookup_failed_${res.status}`);
          }
        } else {
          const data = (await res.json()) as BookingInfo;
          if (!cancelled) {
            setBooking(data);
            setErr(null);
            setLoading(false);
            return; // success: stop polling
          }
        }
      } catch (e: any) {
        // network/other: try a couple more times
        if (!cancelled) setErr(e?.message || "lookup_failed");
      }

      // schedule next try with mild backoff
      setTimeout(tick, delay);
      delay = Math.min(2000, Math.round(delay * 1.2));
    };

    setLoading(true);
    setErr(null);
    tick();

    return () => { cancelled = true; };
  }, [ref]);

  const paid =
    (provider === "paypal" && sp.get("status") === "paid") ||
    (provider === "stripe" && redirectStatus === "succeeded");

  return (
    <main className="p-6 text-white space-y-4">
      <h1 className="text-2xl font-semibold">
        {paid ? "Payment complete ✅" : "Payment status"}
      </h1>

      <p className="text-white/80">
        {provider === "paypal" ? "Paid with PayPal." : "Paid with card (Stripe)."}
      </p>

      <div className="text-white/60 text-sm space-y-1">
        {provider === "paypal" && orderId && (
          <div>PayPal Order ID: <code>{orderId}</code></div>
        )}
        {provider === "stripe" && intentId && (
          <div>Stripe PaymentIntent: <code>{intentId}</code></div>
        )}
      </div>

      {loading && <div className="text-white/70">Finalizing your booking…</div>}
      {err && !loading && !booking && <div className="text-rose-400">{err}</div>}

      {booking && (
        <div className="rounded-xl ring-1 ring-white/15 bg-white/5 p-4 space-y-2">
          <div className="text-lg font-medium">{booking.sessionType}</div>
          <div className="text-white/80">
            When:{" "}
            {new Date(booking.startISO).toLocaleString([], {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            ({Intl.DateTimeFormat().resolvedOptions().timeZone})
          </div>
          <div className="text-white/80">
            Duration: {booking.liveMinutes} min · Follow-ups: {booking.followups}
          </div>
          {typeof booking.amountCents === "number" && (
            <div className="text-white/80">
              Price: {(booking.amountCents / 100).toFixed(2)} {booking.currency.toUpperCase()}
            </div>
          )}
          <div className="pt-2">
            <a
              href={`/api/ics?bookingId=${encodeURIComponent(booking.id)}`}
              className="inline-block rounded-lg bg-white/10 ring-1 ring-white/15 px-4 py-2"
            >
              Add to calendar (.ics)
            </a>
          </div>
        </div>
      )}

      <div className="pt-2">
        <a href="/" className="inline-block rounded-lg bg-white/10 ring-1 ring-white/15 px-4 py-2">
          Back to home
        </a>
      </div>
    </main>
  );
}
