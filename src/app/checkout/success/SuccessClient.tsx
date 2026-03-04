// src/app/checkout/success/SuccessClient.tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Calendar, Clock } from "lucide-react";
import GlassPanel from "@/app/_components/panels/GlassPanel";
import DividerWithLogo from "@/app/_components/small/Divider-logo";

const BG_FADE_DURATION = 3;
const EASE = [0.22, 1, 0.36, 1] as const;
const TAKING_TOO_LONG_MS = 5000;

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

export default function SuccessClient() {
  const sp = useSearchParams();
  const intentId = sp?.get("payment_intent") ?? undefined;
  const ref = useMemo(() => intentId ?? undefined, [intentId]);

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(!!ref);
  const [err, setErr] = useState<string | null>(null);
  const [block1Phase, setBlock1Phase] = useState<"loading" | "revealing" | "revealed">(
    "loading"
  );
  const [blocks2And3Visible, setBlocks2And3Visible] = useState(false);
  const [contentHeightExpanded, setContentHeightExpanded] = useState(false);
  const [takingTooLong, setTakingTooLong] = useState(false);

  useEffect(() => {
    if (booking) {
      setTakingTooLong(false);
      return;
    }
    const t = setTimeout(() => setTakingTooLong(true), TAKING_TOO_LONG_MS);
    return () => clearTimeout(t);
  }, [booking]);

  useEffect(() => {
    if (!booking && (loading || !ref)) {
      setBlock1Phase("loading");
      setBlocks2And3Visible(false);
    }
  }, [loading, booking, ref]);

  useEffect(() => {
    if (booking && !loading) {
      setBlock1Phase("revealing");
      setContentHeightExpanded(false);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setContentHeightExpanded(true));
      });
      const t1 = setTimeout(() => setBlock1Phase("revealed"), 600);
      const t2 = setTimeout(() => setBlocks2And3Visible(true), 2000);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [booking, loading]);

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
    const startTimer = setTimeout(() => tick(), 1000);
    return () => {
      cancelled = true;
      clearTimeout(startTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  const StatusIcon = err ? AlertCircle : CheckCircle2;

  return (
    <main className="relative min-h-[100svh] text-white">
      {/* Particle background – fade in like SessionHero */}
      <motion.div
        className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: BG_FADE_DURATION, ease: EASE }}
      >
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
      </motion.div>

      <div className="relative z-10 px-3 md:px-8 pt-20 pb-16">
        <div className="mx-auto max-w-lg space-y-4">
          {/* Block 1: loading → session info */}
          <GlassPanel className="relative p-5 md:p-6 flex flex-col justify-center min-h-[200px] ring-[rgba(88,101,242,0.45)] shadow-[0_0_24px_rgba(88,101,242,0.12)] overflow-hidden">
            {/* Nebula gradient overlay (loading / revealing) */}
            {(block1Phase === "loading" || block1Phase === "revealing") && (
              <div
                className="absolute inset-0 transition-opacity duration-500 ease-out"
                style={{
                  opacity: block1Phase === "revealing" ? 0 : 1,
                  background:
                    "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(59, 130, 246, 0.22), transparent 50%), radial-gradient(ellipse 60% 80% at 80% 80%, rgba(99, 102, 241, 0.18), transparent 45%), radial-gradient(ellipse 70% 50% at 20% 60%, rgba(37, 99, 235, 0.15), transparent 50%)",
                }}
                aria-hidden
              />
            )}
            {block1Phase === "loading" && (
              <div className="relative flex flex-col items-center justify-center gap-3 text-white/90 min-h-[180px]">
                <StatusIcon className="w-9 h-9 animate-pulse" />
                <p className="text-sm font-medium">Finalizing your session</p>
                {takingTooLong && (
                  <p className="absolute bottom-4 left-0 right-0 text-sm text-white/70 text-center px-4">
                    This is taking a while… please reach out to Sho.
                  </p>
                )}
              </div>
            )}
            {err && !loading && !booking && (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-rose-200 text-sm">
                <AlertCircle className="w-8 h-8" />
                <p className="text-center">{err}</p>
              </div>
            )}
            {booking && (
              <div
                className="relative grid transition-[grid-template-rows] duration-500 ease-out"
                style={{ gridTemplateRows: contentHeightExpanded ? "1fr" : "0fr" }}
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    className="flex flex-col gap-4 transition-opacity duration-500 ease-out"
                    style={{ opacity: block1Phase === "loading" ? 0 : 1 }}
                  >
                    <h2 className="text-xl font-semibold text-white/95">
                      Your session has been scheduled.
                    </h2>
                    <DividerWithLogo/>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 flex-1 items-start">
                  {/* Left: Scheduled Time header + date, then time – timezone */}
                  <div className="flex flex-col text-base leading-tight">
                    <div className="font-semibold text-white/95 text-base mb-1.5">Scheduled Time</div>
                    <div className="flex items-center gap-2 text-white/75">
                      <Calendar className="w-4 h-4 shrink-0 text-[#7289DA]" />
                      <span>
                        {new Date(booking.startISO).toLocaleString([], { weekday: "long" })}{" "}
                        {new Date(booking.startISO).toLocaleString([], { day: "numeric" })}{" "}
                        {new Date(booking.startISO).toLocaleString([], { month: "long" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-white/75">
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
                </div>
              </div>
            )}
          </GlassPanel>

          {booking && (
            <GlassPanel
              className="p-5 md:p-6 flex flex-col justify-center min-h-[200px] ring-[rgba(88,101,242,0.45)] shadow-[0_0_24px_rgba(88,101,242,0.12)] transition-all duration-[1.1s] ease-out"
              style={{
                opacity: blocks2And3Visible ? 1 : 0,
                transform: blocks2And3Visible ? "translateY(0)" : "translateY(6px)",
              }}
            >
              <h2 className="text-xl font-semibold mb-2">What&apos;s next?</h2>
              <p className="text-base text-white/80 leading-relaxed mb-4">
                You&apos;ll receive a confirmation DM from Axom via Discord. Join the server, if you haven&apos;t already.
              </p>
              <div className="flex flex-col items-stretch sm:flex-row sm:items-start justify-between gap-4">
                <div className="relative h-14 w-full sm:w-56 shrink-0 overflow-hidden rounded-xl">
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
            <GlassPanel
              className="p-5 md:p-6 flex flex-col justify-center  ring-[rgba(88,101,242,0.45)] shadow-[0_0_24px_rgba(88,101,242,0.12)] transition-all duration-[1.1s] ease-out"
              style={{
                opacity: blocks2And3Visible ? 1 : 0,
                transform: blocks2And3Visible ? "translateY(0)" : "translateY(6px)",
                transitionDelay: blocks2And3Visible ? "500ms" : "0ms",
              }}
            >
              <h2 className="text-xl font-semibold mb-2">Quick reminder</h2>
              <ul className="text-base text-white/80 space-y-1 list-disc list-outside pl-5">
                <li>Make sure you played games on this patch to review.</li>
                <li>Check your mic & audio before the session to avoid disaster.</li>
                <li>Don't tilt.</li>
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

