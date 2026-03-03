// src/app/checkout/success/SuccessClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Calendar, Clock } from "lucide-react";
import GlassPanel from "@/app/_components/panels/GlassPanel";
import DividerWithLogo from "@/app/_components/small/Divider-logo";

type BookingInfo = {
  id: string;
  sessionType: string;
  liveMinutes: number;
  followups: number;
  liveBlocks?: number;
  currency: string;
  amountCents: number | null;
  startISO: string;
};

function isBookingInfo(v: unknown): v is BookingInfo {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.sessionType === "string" &&
    typeof o.liveMinutes === "number" &&
    typeof o.followups === "number" &&
    typeof o.currency === "string" &&
    (typeof o.amountCents === "number" || o.amountCents === null) &&
    typeof o.startISO === "string"
  );
}

const FAKE_BOOKING: BookingInfo = {
  id: "test-booking-123",
  sessionType: "VOD Review",
  liveMinutes: 60,
  followups: 1,
  currency: "eur",
  amountCents: 4900,
  startISO: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // ~2 days from now
};

export default function SuccessClient() {
  const sp = useSearchParams();

  const isTestMode = sp?.get("test") === "1";

  // Stripe-only
  const redirectStatus = sp?.get("redirect_status") ?? undefined;
  const intentId = sp?.get("payment_intent") ?? undefined;

  const ref = useMemo(
    () => (isTestMode ? undefined : intentId ? intentId : undefined),
    [isTestMode, intentId]
  );

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(!isTestMode && !!ref);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (isTestMode) {
      setBooking(FAKE_BOOKING);
      setLoading(false);
      setErr(null);
      return;
    }
  }, [isTestMode]);

  useEffect(() => {
    if (!ref || isTestMode) return;
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
        const res = await fetch(`/api/booking/from-ref?ref=${encodeURIComponent(ref)}`, {
          cache: "no-store",
        });

        if (res.status === 404) {
          setLoading(true);
        } else if (!res.ok) {
          let msg: string | undefined;
          try {
            const j = (await res.json()) as unknown;
            if (typeof j === "object" && j && "error" in (j as any)) {
              msg = String((j as any).error);
            }
          } catch {
            // ignore JSON parse errors
          }
          if (msg === "not_found") setLoading(true);
          else throw new Error(msg || `lookup_failed_${res.status}`);
        } else {
          const data = (await res.json()) as unknown;
          if (!cancelled && isBookingInfo(data)) {
            setBooking(data);
            setErr(null);
            setLoading(false);
            return;
          }
        }
      } catch (e: unknown) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "lookup_failed";
          setErr(msg);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, isTestMode]);

  const StatusIcon = err ? AlertCircle : CheckCircle2;

  return (
    <main className="relative min-h-[100svh] text-white">
      {/* Particle background (same as presets) – temporary */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <video
          src="/videos/customize/Particle1_slow.webm"
          autoPlay
          muted
          loop
          playsInline
          className="hidden md:block h-full w-full object-cover object-left md:object-center"
        />
        <video
          src="/videos/customize/Particle_mobile480p.webm"
          autoPlay
          muted
          loop
          playsInline
          className="block md:hidden h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative z-10 px-5 pt-32 pb-16">
        <div className="mx-auto max-w-lg space-y-4">
          {/* Block 1: loading → session info */}
          <GlassPanel className="p-4 md:p-5 flex flex-col min-h-[200px] ring-[rgba(88,101,242,0.45)] shadow-[0_0_24px_rgba(88,101,242,0.12)]">
            {loading && (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-white/75">
                <StatusIcon className="w-8 h-8 animate-pulse" />
                <p className="text-sm">Finalizing your booking…</p>
              </div>
            )}
            {err && !loading && !booking && (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-rose-200 text-sm">
                <AlertCircle className="w-8 h-8" />
                <p className="text-center">{err}</p>
              </div>
            )}
            {booking && (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold text-white/95">
                  Your session has been scheduled.
                </h2>
                <DividerWithLogo/>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 flex-1 items-start">
                  {/* Left: Scheduled Time header + date, then time – timezone */}
                  <div className="flex flex-col text-base text-white/90 leading-tight">
                    <div className="font-semibold text-white/95 text-base mb-1.5">Scheduled Time</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 shrink-0 text-[#7289DA]" />
                      <span>
                        {new Date(booking.startISO).toLocaleString([], { weekday: "long" })}{" "}
                        {new Date(booking.startISO).toLocaleString([], { day: "numeric" })}{" "}
                        {new Date(booking.startISO).toLocaleString([], { month: "long" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="w-4 h-4 shrink-0 text-[#7289DA]" />
                      <span>
                        {new Date(booking.startISO).toLocaleString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" – "}
                        {Intl.DateTimeFormat().resolvedOptions().timeZone}
                      </span>
                    </div>
                  </div>
                  {/* Right: session name + bullet list (min/followups/blocks) */}
                  <div className="flex flex-col">
                    <div className="font-semibold text-white/95 text-base mb-2">
                      {booking.sessionType}
                    </div>
                    <ul className="space-y-1 list-disc list-inside text-base text-white/75">
                      <li>{booking.liveMinutes} min</li>
                      {booking.followups > 0 && (
                        <li>{booking.followups} Follow-up{booking.followups === 1 ? "" : "s"}</li>
                      )}
                      {booking.liveBlocks != null && booking.liveBlocks > 0 && (
                        <li>{booking.liveBlocks} block{booking.liveBlocks === 1 ? "" : "s"}</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </GlassPanel>

          {booking && (
            <GlassPanel className="p-4 md:p-5 flex flex-col ring-[rgba(88,101,242,0.45)] shadow-[0_0_24px_rgba(88,101,242,0.12)]">
              <h2 className="text-xl font-semibold mb-2">What&apos;s next?</h2>
              <p className="text-base text-white/80 leading-relaxed mb-4">
                You&apos;ll receive a confirmation DM from Axom via Discord. Make sure you join the server.
              </p>
              <div className="flex items-end justify-between gap-4 mt-auto">
                <div className="relative h-14 w-56 shrink-0 overflow-hidden rounded-xl">
                  <Image
                    src="/images/checkout/success/AxomIMG.png"
                    alt="Axom"
                    fill
                    className="object-contain"
                    sizes="56px"
                    unoptimized
                  />
                </div>
                <DiscordButton className="shrink-0 px-4 py-2 text-base" />
              </div>
            </GlassPanel>
          )}

          {booking && (
            <GlassPanel className="p-4 md:p-5 flex flex-col ring-[rgba(88,101,242,0.45)] shadow-[0_0_24px_rgba(88,101,242,0.12)]">
              <h2 className="text-xl font-semibold mb-2">Before we start</h2>
              <ul className="text-base text-white/80 space-y-1 list-disc list-inside">
                <li>Placeholder prep step you can customize.</li>
                <li>Another short bullet about what to bring.</li>
                <li>Any last-minute notes or expectations.</li>
              </ul>
            </GlassPanel>
          )}
        </div>
      </div>
    </main>
  );
}

function DiscordButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="https://discord.gg/HfvxZBp"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center rounded-xl px-10 py-3 font-medium text-base
                  bg-[#5865F2] hover:bg-[#4752C4] text-white transition
                  shadow-[0_10px_24px_rgba(88,101,242,.45)] ${className}`}
    >
      Join Discord
    </Link>
  );
}

