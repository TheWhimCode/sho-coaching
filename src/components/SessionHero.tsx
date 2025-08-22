"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import AvailableSlots, { Slot as UiSlot } from "@/components/AvailableSlots";
import CenterSessionPanel from "@/components/CenterSessionPanel";
import { fetchSuggestedStarts } from "@/lib/booking/suggest";
import { SlotStatus } from "@prisma/client";
import { computeQuickPicks } from "@/lib/booking/quickPicks";
import { fetchSlots } from "@/utils/api";
import SlotSkeletons from "../components/SlotSkeletons";

/* ---------- VOD Review steps (minimal, stylish) ---------- */

/* ---------- Steps data ---------- */
/* ---------- Steps data ---------- */
const vodSteps = [
  { title: "Pick 1–2 games & join Discord" },
  { title: "Analyze critical mistakes" },
  { title: "Identify habits holding you back" },
  { title: "Learn how to practise long-term" },
  { title: "Get your VOD + Notes package" },
];

/* ---------- Left column (with gradient dividers) ---------- */
function LeftSteps({
  steps,
  title = "How it works",
}: {
  steps: { title: string }[];
  title?: string;
}) {
  return (
    <div
      className={[
        // container
        "relative rounded-2xl backdrop-blur-md ring-1 ring-[rgba(146,180,255,.18)]",
        // size + spacing (responsive)
        "p-6 md:p-7 lg:p-8",
        "min-h-[420px] md:min-h-[470px] lg:min-h-[520px]", // taller but not as tall as center
        // background
        "bg-[#0B1220]/80",
      ].join(" ")}
    >
      {/* header */}
      <div className="mb-4 md:mb-5">
        <div className="text-xs uppercase tracking-wider text-[#8FB8E6]/90">
          Quick overview
        </div>
        <h3 className="mt-1 inline-block pb-1 text-[18px] md:text-[19px] lg:text-[20px] font-semibold border-b border-white/20">
          {title}
        </h3>
      </div>

      {/* list fills available height */}
      <ul className="flex flex-col justify-between h-[calc(100%-7rem)] md:h-[calc(100%-7.5rem)] lg:h-[calc(100%-8rem)]">
        {steps.map((s, idx) => (
          <li key={idx} className="relative">
            <div className="flex items-center">
              {/* minimal number orb */}
              <span className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/[.05] ring-1 ring-white/10 text-[13px] font-semibold text-white/85">
                {idx + 1}
              </span>

              {/* text */}
              <div className="grow pl-4 pr-2 py-3 lg:py-3.5">
                <div className="text-[15px] md:text-[15.5px] lg:text-[16px] leading-[1.3] text-white/90">
                  {s.title}
                </div>
              </div>
            </div>

            {/* gradient divider between items (aligned to text start) */}
            {idx < steps.length - 1 && (
              <div className="absolute left-[calc(2rem+0.75rem)] right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
            )}
          </li>
        ))}
      </ul>

      {/* footnote */}
      <p className="mt-5 md:mt-6 text-[12px] text-white/55">
        Skim if you like — the center panel and the button on the right have
        everything you need.
      </p>

      {/* faint corner glow so it reads as supportive, not primary */}
      <span className="pointer-events-none absolute -inset-3 -z-10 rounded-[24px] opacity-20 blur-2xl bg-[radial-gradient(70%_50%_at_0%_0%,_rgba(148,182,255,.25),_transparent_60%)]" />
    </div>
  );
}


/* -------------------------- Props -------------------------- */

type Props = {
  title: string;
  subtitle: string;
  image: string;
  children?: ReactNode;
  showHint?: boolean;
  followups?: number;

  onHintClick?: () => void;
  howItWorks?: string[]; // kept for compatibility; not used now
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

/* ------------------------- Component ------------------------ */

export default function SessionHero({
  title,
  subtitle,
  image,
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
  const [quickPool, setQuickPool] = useState<{ id: string; startISO: string }[]>([]);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const end = new Date(tomorrow);
        end.setDate(end.getDate() + 21);
        end.setHours(23, 59, 59, 999);

        const rows = await fetchSlots(tomorrow, end, liveMinutes);
        if (!on) return;
        setQuickPool(
          rows.map((r: any) => ({
            id: r.id,
            startISO: r.startTime ?? r.startISO,
          }))
        );
      } catch {
        /* ignore */
      }
    })();
    return () => {
      on = false;
    };
  }, [liveMinutes]);

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
          status: SlotStatus.free,
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

  const quick = useMemo(() => computeQuickPicks(quickPool), [quickPool]);

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
              <h1 className="text-6xl font-extrabold leading-tight md:text-6xl lg:text-7xl">
                {title}
              </h1>
              <p className="mt-2 text-white/80 text-xl">{subtitle}</p>
            </header>

            {/* LEFT — minimal timeline/list */}
            <div className="self-start">
              <LeftSteps steps={vodSteps} title="How it works" />
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
                  <span className="pointer-events-none absolute -inset-1 rounded-xl blur-md opacity-30 -z-10 bg-[radial-gradient(60%_100%_at_50%_50%,_rgba(255,179,71,.28),_transparent_70%)]" />
                  <button
                    onClick={() => onOpenCalendar?.({ liveMinutes })}
                    className="relative z-10 w-full rounded-xl px-5 py-3 text-base font-semibold text-[#0A0A0A] bg-[#fc8803] hover:bg-[#f8a81a] transition shadow-[0_10px_28px_rgba(245,158,11,.35)] ring-1 ring-[rgba(255,190,80,.55)]"
                  >
                    Book now
                  </button>
                </div>

                {onCustomize && (
                  <button
                    onClick={onCustomize}
                    className="w-full rounded-xl px-5 py-3 text-base font-medium bg-white/10 hover:bg-white/15 ring-1 ring-white/15 transition"
                  >
                    Customize
                  </button>
                )}

                {/* Next available quick-picks */}
                <div className="mt-1 text-xs text-[#8FB8E6]">Next available</div>

                {loading ? (
                  <SlotSkeletons count={3} />
                ) : quick.length ? (
                  <AvailableSlots
                    slots={quick.map((q) => ({
                      id: q.id,
                      startISO: q.startISO,
                      durationMin: liveMinutes,
                      status: SlotStatus.free,
                      label: q.label,
                    }))}
                    onPick={(id) => onOpenCalendar?.({ slotId: id, liveMinutes })}
                  />
                ) : (
                  <div className="mt-2 text-xs text-white/60">
                    No times found in the next 2 weeks.
                  </div>
                )}

                <p className="text-xs text-white/70 mt-1">
                  Secure checkout (Stripe). Custom options available.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
