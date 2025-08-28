// app/checkout/success/SuccessClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

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

export default function SuccessClient() {
  const sp = useSearchParams();

  const provider = sp?.get("provider") ?? "stripe";
  const orderId = sp?.get("orderId") ?? undefined;
  const redirectStatus = sp?.get("redirect_status") ?? undefined;
  const intentId = sp?.get("payment_intent") ?? undefined;

  const ref = useMemo(() => {
    if (provider === "paypal" && orderId) return orderId;
    if (provider === "stripe" && intentId) return intentId;
    return undefined;
  }, [provider, orderId, intentId]);

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(!!ref);
  const [err, setErr] = useState<string | null>(null);
  const [showTech, setShowTech] = useState(false);

  useEffect(() => {
    if (!ref) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 12;
    let delay = 1000;

    const tick = async () => {
      if (cancelled || attempts >= maxAttempts) {
        if (!cancelled && !booking) {
          setErr("Still finalizing your booking. Please refresh in a moment.");
        }
        setLoading(false);
        return;
      }
      attempts += 1;

      try {
        const res = await fetch(
          `/api/booking/from-ref?ref=${encodeURIComponent(ref)}`,
          { cache: "no-store" }
        );
        if (res.status === 404) {
          setLoading(true);
        } else if (!res.ok) {
          const j = await res.json().catch(() => ({}));
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
            return;
          }
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "lookup_failed");
      }

      setTimeout(tick, delay);
      delay = Math.min(2000, Math.round(delay * 1.2));
    };

    setLoading(true);
    setErr(null);
    tick();
    return () => {
      cancelled = true;
    };
  }, [ref]); // eslint-disable-line react-hooks/exhaustive-deps

  const paid =
    (provider === "paypal" && sp?.get("status") === "paid") ||
    (provider === "stripe" && redirectStatus === "succeeded");

  const StatusIcon = paid ? CheckCircle2 : err ? AlertCircle : Clock;
  const statusText = paid
    ? "Payment complete"
    : err
    ? "Payment status"
    : "Finalizing payment…";

  return (
    <main className="px-5 py-6 text-white">
      <div
        className="
          mx-auto max-w-xl relative rounded-2xl p-6
          bg-[linear-gradient(135deg,#11182a_0%,#0e1526_45%,#0c1322_100%)]
          border border-[rgba(146,180,255,0.12)]
          ring-1 ring-[rgba(146,180,255,0.14)]
          shadow-[0_12px_40px_rgba(0,0,0,0.5)]
        "
      >
        {/* inner glow */}
        <span
          aria-hidden
          className="
            pointer-events-none absolute inset-0 rounded-2xl
            bg-[radial-gradient(120%_120%_at_50%_0%,rgba(105,168,255,0.25),transparent_60%)]
            opacity-100 blur-[14px]
          "
        />

        <div className="relative space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-semibold">{statusText}</h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs
                ${paid ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/25" : err ? "bg-rose-400/10 text-rose-300 ring-1 ring-rose-400/25" : "bg-white/10 text-white/80 ring-1 ring-white/15"}
              `}
            >
              <StatusIcon className="w-4 h-4" />
              {paid ? "Succeeded" : err ? "Check status" : "Processing"}
            </span>
          </div>

          {/* Friendly message */}
          <p className="text-white/80">
            {provider === "paypal"
              ? "Thanks! You paid with PayPal."
              : "Thanks! Your card payment was successful."}
          </p>

          {/* Booking summary */}
          {loading && (
            <div className="rounded-xl ring-1 ring-white/15 bg-white/5 p-4 text-white/75">
              Finalizing your booking…
            </div>
          )}

          {err && !loading && !booking && (
            <div className="rounded-xl ring-1 ring-rose-400/25 bg-rose-400/10 p-4 text-rose-200">
              {err}
            </div>
          )}

          {booking && (
            <div className="rounded-xl ring-1 ring-white/15 bg-white/5 p-4 space-y-3">
              <div className="text-lg font-medium">{booking.sessionType}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-white/85">
                <div>
                  <div className="text-xs text-white/60">When</div>
                  <div>
                    {new Date(booking.startISO).toLocaleString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                  </div>
                </div>
                <div>
                  <div className="text-xs text-white/60">Duration</div>
                  <div>
                    {booking.liveMinutes} min · {booking.followups} follow-up
                    {booking.followups === 1 ? "" : "s"}
                  </div>
                </div>
                {typeof booking.amountCents === "number" && (
                  <div>
                    <div className="text-xs text-white/60">Price</div>
                    <div>
                      {(booking.amountCents / 100).toFixed(2)}{" "}
                      {booking.currency.toUpperCase()}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-white/60">Discord</div>
                  <div>{booking.discord}</div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <a
                  href={`/api/ics?bookingId=${encodeURIComponent(booking.id)}`}
                  className="inline-flex items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15 px-4 py-2 text-white/90 hover:bg-white/12 transition"
                >
                  Add to calendar (.ics)
                </a>
              </div>
            </div>
          )}

          {/* Technical details (hidden by default) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowTech((v) => !v)}
              className="text-xs text-white/65 hover:text-white underline"
            >
              {showTech ? "Hide technical details" : "Show technical details"}
            </button>
            {showTech && (
              <div className="mt-2 rounded-lg bg-white/5 ring-1 ring-white/10 p-3 text-xs text-white/75 space-y-1">
                <div>Provider: {provider}</div>
                {orderId && <div>PayPal Order ID: {orderId}</div>}
                {intentId && <div>Stripe PaymentIntent: {intentId}</div>}
                {redirectStatus && <div>Stripe redirect_status: {redirectStatus}</div>}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A]
                         bg-[#fc8803] hover:bg-[#f8a81a] transition
                         shadow-[0_10px_28px_rgba(245,158,11,.35)]
                         ring-1 ring-[rgba(255,190,80,.55)]"
            >
              Back to home
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
