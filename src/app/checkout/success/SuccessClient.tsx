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
  currency: string;
  amountCents: number | null;
  startISO: string;
};

export default function SuccessClient() {
  const sp = useSearchParams();

  // Stripe-only
  const redirectStatus = sp?.get("redirect_status") ?? undefined;
  const intentId = sp?.get("payment_intent") ?? undefined;

  const ref = useMemo(() => (intentId ? intentId : undefined), [intentId]);

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(!!ref);
  const [err, setErr] = useState<string | null>(null);

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
        const res = await fetch(`/api/booking/from-ref?ref=${encodeURIComponent(ref)}`, { cache: "no-store" });
        if (res.status === 404) {
          setLoading(true);
        } else if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          if (j?.error === "not_found") setLoading(true);
          else throw new Error(j?.error || `lookup_failed_${res.status}`);
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
    return () => { cancelled = true; };
  }, [ref]); // eslint-disable-line react-hooks/exhaustive-deps

  const paid = redirectStatus === "succeeded";

  const StatusIcon = paid ? CheckCircle2 : err ? AlertCircle : Clock;
  const statusText = paid ? "Payment complete" : err ? "Payment status" : "Finalizing payment…";

  return (
    <main className="px-5 pt-32 pb-12 text-white">
      <div className="mx-auto max-w-md space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{statusText}</h1>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ring-1
              ${paid ? "bg-sky-400/10 text-sky-300 ring-sky-400/25"
                     : err ? "bg-rose-400/10 text-rose-300 ring-rose-400/25"
                           : "bg-white/10 text-white/80 ring-white/15"}`}
          >
            <StatusIcon className="w-4 h-4" />
            {paid ? "Succeeded" : err ? "Check status" : "Processing"}
          </span>
        </div>

        {/* Subtext */}
        <p className="text-white/80">Thanks! Your payment was successful.</p>

        {/* States */}
        {loading && (
          <div className="rounded-2xl ring-1 ring-white/15 bg-white/5 p-4 text-white/75">Finalizing your booking…</div>
        )}
        {err && !loading && !booking && (
          <div className="rounded-2xl ring-1 ring-rose-400/25 bg-rose-400/10 p-4 text-rose-200">{err}</div>
        )}

        {booking && (
          <section
            className="
              relative overflow-hidden rounded-2xl p-5
              bg-[linear-gradient(135deg,#11182a_0%,#0e1526_45%,#0c1322_100%)]
              ring-1 ring-[rgba(146,180,255,0.14)]
              border border-[rgba(146,180,255,0.12)]
              shadow-[0_12px_40px_rgba(0,0,0,0.45)]
              space-y-4
            "
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-2xl opacity-100 blur-[14px]
                         bg-[radial-gradient(120%_120%_at_50%_0%,rgba(105,168,255,0.22),transparent_60%)]"
            />

            <div className="relative">
              <div className="text-base md:text-lg font-semibold">{booking.sessionType}</div>
            </div>

            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              {/* WHEN with timezone on the label row */}
              <Item
                label={
                  <span className="flex items-center gap-1">
                    <span>When</span>
                    <span className="text-[10px] uppercase tracking-wide text-white/55">
                      ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                    </span>
                  </span>
                }
              >
                {new Date(booking.startISO).toLocaleString([], {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Item>

              <Item label="Duration">
                {booking.liveMinutes} min
                {booking.followups > 0 && (
                  <>
                    {" "}
                    · {booking.followups} Follow-up{booking.followups === 1 ? "" : "s"}
                  </>
                )}
              </Item>

              {typeof booking.amountCents === "number" && (
                <Item label="Price">
                  {(booking.amountCents / 100).toFixed(2)} {booking.currency.toUpperCase()}
                </Item>
              )}
            </div>

            <div className="relative pt-1">
              <a
                href={`/api/ics?bookingId=${encodeURIComponent(booking.id)}`}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2
                           text-sm font-medium text-white/90
                           bg-white/10 hover:bg-white/12 transition
                           ring-1 ring-white/15"
              >
                Add to calendar
              </a>
            </div>
          </section>
        )}

        {/* Join Discord CTA */}
        <div className="pt-2">
          <a
            href="https://discord.gg/HfvxZBp"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-2xl px-5 py-3
                       text-base font-semibold text-white/95
                       bg-[#5865F2] hover:bg-[#4752C4] transition
                       ring-1 ring-white/15 shadow-[0_10px_28px_rgba(88,101,242,.35)]"
          >
            Join Discord
          </a>
        </div>
      </div>
    </main>
  );
}

function Item({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] uppercase tracking-wide text-white/55">{label}</div>
      <div className="text-white/90 leading-5">{children}</div>
    </div>
  );
}
