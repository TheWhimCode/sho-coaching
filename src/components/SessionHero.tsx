"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import AvailableSlots, { Slot as UiSlot } from "@/components/AvailableSlots";
import CenterSessionPanel from "@/components/CenterSessionPanel";
import { fetchSuggestedStarts } from "@/lib/booking/suggest";
import { SlotStatus } from "@prisma/client";

function StepPill({ i, text }: { i: number; text: string }) {
  return (
    <div
      aria-disabled
      className="select-text rounded-xl px-6 py-5 min-h-[72px] flex items-center gap-4
                 backdrop-blur-md bg-[#0B1220]/80 ring-1 ring-[rgba(146,180,255,.18)]"
    >
      <span className="select-none inline-flex h-9 w-9 items-center justify-center rounded-full
                       bg-white/10 ring-1 ring-white/15 text-sm font-semibold">
        {i}
      </span>
      <span className="text-base text-white/90">{text}</span>
    </div>
  );
}

type Props = {
  title: string;
  subtitle: string;
  image: string;
  children?: ReactNode;
  showHint?: boolean;
  followups?: number;

  onHintClick?: () => void;
  howItWorks?: string[];
  onCustomize?: () => void;
  onBookNow?: () => void;
  onOpenCalendar?: (opts: { slotId?: string; liveMinutes: number }) => void;

  slots?: UiSlot[];
  onPickSlot?: (id: string) => void;

  baseMinutes?: number;
  basePriceEUR?: number;
  extraMinutes?: number;
  totalPriceEUR?: number;
  isCustomizingCenter?: boolean;
};

export default function SessionHero({
  title,
  subtitle,
  image,
  howItWorks,
  onCustomize,
  onOpenCalendar,
  slots,
  followups,
  baseMinutes = 60,
  basePriceEUR = 50,
  extraMinutes = 0,
  totalPriceEUR = 50,
  isCustomizingCenter = false,
}: Props) {
  const [autoSlots, setAutoSlots] = useState<UiSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const liveMinutes = (baseMinutes ?? 60) + (extraMinutes ?? 0);

  useEffect(() => {
    let on = true;
    setLoading(true);
    (async () => {
      try {
        const s = await fetchSuggestedStarts(liveMinutes);
        if (!on) return;
        const mapped: UiSlot[] = s.map((x) => ({
          id: x.id,
          startISO: x.startTime,
          durationMin: liveMinutes,
          status: SlotStatus.free, // suggestions are free by definition
        }));
        setAutoSlots(mapped);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => {
      on = false;
    };
  }, [liveMinutes]);

  const effectiveSlots = (slots?.length ? slots : autoSlots) as UiSlot[];

  return (
    <section className="relative isolate h-[100svh] overflow-hidden text-white vignette">
      {/* Background stack (non-interactive) */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <video
          src="/videos/hero-test.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover [filter:grayscale(1)_contrast(1.05)_brightness(.8)]"
        />
        <div className="absolute inset-0 mix-blend-color bg-[#1f3d8b]/90" />
        <div className="absolute inset-0 bg-black/30" />
      </div>
      <div className="absolute inset-0 hud-grid pointer-events-none z-0" />
      <div className="absolute inset-0 scanlines pointer-events-none z-0" />
      <div className="absolute inset-0 noise pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-20 h-full flex items-center py-10 md:py-14">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-8">
          <div className="grid md:grid-cols-[1.2fr_1.1fr_.95fr] gap-7 items-start">
            {/* HEADER spans grid */}
            <header className="md:col-span-3 mb-2 md:mb-4">
              <h1 className="text-6xl font-extrabold leading-tight md:text-6xl lg:text-7xl">{title}</h1>
              <p className="mt-2 text-white/80 text-xl">{subtitle}</p>
            </header>

            {/* LEFT */}
            <div className="self-start">
              <div className="rounded-2xl p-7 space-y-5 backdrop-blur-md bg-[#0B1220]/80 ring-1 ring-[rgba(146,180,255,.18)]">
                {howItWorks?.length ? (
                  <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
                    {howItWorks.map((t, i) => (
                      <StepPill key={i} i={i + 1} text={t} />
                    ))}
                    <StepPill i={(howItWorks.length ?? 0) + 1} text="Pick a time slot" />
                    <StepPill i={(howItWorks.length ?? 0) + 2} text="Get your action plan" />
                  </div>
                ) : null}
              </div>
            </div>

            {/* CENTER */}
            <div className="self-start">
              <CenterSessionPanel
                title={title}
                baseMinutes={baseMinutes}
                extraMinutes={extraMinutes}
                totalPriceEUR={totalPriceEUR}
                isCustomizing={isCustomizingCenter}
                followups={followups ?? 0}
              />
            </div>

            {/* RIGHT — CTA + slots */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="self-start md:justify-self-end w-full max-w-sm"
            >
              <div className="rounded-2xl p-5 flex flex-col gap-3 backdrop-blur-md bg-[#0B1220]/80 ring-1 ring-[rgba(146,180,255,.18)]">
                {/* CTA with halo behind */}
                <div className="relative">
                  <span className="pointer-events-none absolute -inset-1 rounded-xl blur-md opacity-30 -z-10
                                   bg-[radial-gradient(60%_100%_at_50%_50%,_rgba(255,179,71,.28),_transparent_70%)]" />
                  <button
                    onClick={() => onOpenCalendar?.({ liveMinutes })}
                    className="relative z-10 w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A]
                               bg-[#fc8803] hover:bg-[#f8a81a] transition
                               shadow-[0_10px_28px_rgba(245,158,11,.35)] ring-1 ring-[rgba(255,190,80,.55)]"
                  >
                    Book now
                  </button>
                </div>

                {onCustomize && (
                  <button
                    onClick={onCustomize}
                    className="w-full rounded-xl px-5 py-3 text-base font-medium
                               bg-white/10 hover:bg-white/15 ring-1 ring-white/15 transition"
                  >
                    Customize
                  </button>
                )}

                {/* Next available */}
                {loading ? (
                  <div className="text-xs text-white/70">Loading times…</div>
                ) : effectiveSlots?.length ? (
                  <>
                    <div className="mt-1 text-xs text-[#8FB8E6]">Next available</div>
                    <AvailableSlots
                      slots={effectiveSlots}
                      onPick={(id) => onOpenCalendar?.({ slotId: id, liveMinutes })}
                    />
                  </>
                ) : null}

                <p className="text-xs text-white/70 mt-1">Secure checkout (Stripe). Custom options available.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
