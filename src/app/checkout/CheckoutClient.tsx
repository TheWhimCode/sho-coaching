// src/app/checkout/CheckoutClient.tsx
"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import UsefulToKnow from "@/components/checkout/UsefulToKnow";
import { buildBreakdown } from "@/components/checkout/buildBreakdown";
import CheckoutPanel from "@/components/checkout/CheckoutPanel";
import { appearanceDarkBrand } from "@/lib/checkout/stripeAppearance";

import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const MIN = 30;
const MAX = 120;
const LIVEBLOCK_MIN = 45;

function clampN(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

function deriveBaseMinutes({
  liveMinParam,
  liveMinutesParam,
  liveBlocks,
}: {
  liveMinParam: number | null;
  liveMinutesParam: number | null;
  liveBlocks: number;
}) {
  if (typeof liveMinParam === "number" && !Number.isNaN(liveMinParam)) {
    return clampN(liveMinParam, MIN, MAX);
  }
  const lm =
    typeof liveMinutesParam === "number" && !Number.isNaN(liveMinutesParam)
      ? liveMinutesParam
      : 60;
  return clampN(lm - liveBlocks * LIVEBLOCK_MIN, MIN, MAX);
}

function mergedMinutes(baseMinutes: number, liveBlocks: number) {
  return clampN(baseMinutes + liveBlocks * LIVEBLOCK_MIN, MIN, MAX);
}

export default function CheckoutClient() {
  const sp = useSearchParams();

  const payload = useMemo(() => {
    const liveBlocks = Number(sp.get("liveBlocks") ?? 0) || 0;
    const liveMinParam = sp.get("liveMin");
    const liveMinutesParam = sp.get("liveMinutes");

    const baseMinutes = deriveBaseMinutes({
      liveMinParam: liveMinParam ? Number(liveMinParam) : null,
      liveMinutesParam: liveMinutesParam ? Number(liveMinutesParam) : null,
      liveBlocks,
    });

    const totalMins = mergedMinutes(baseMinutes, liveBlocks);

    return {
      slotId: String(sp.get("slotId") ?? ""),
      sessionType: String(sp.get("sessionType") ?? "Session"),
      baseMinutes,
      liveMinutes: totalMins,
      followups: Number(sp.get("followups") ?? 0) || 0,
      liveBlocks,
      discord: String(sp.get("discord") ?? ""),
      preset: String(sp.get("preset") ?? "custom"),
      holdKey: String(sp.get("holdKey") ?? ""),
    };
  }, [sp]);

  const breakdown = useMemo(
    () => buildBreakdown(payload.liveMinutes, payload.followups, payload.liveBlocks),
    [payload.liveMinutes, payload.followups, payload.liveBlocks]
  );

  const payloadForBackend = useMemo(
    () => ({
      slotId: payload.slotId,
      sessionType: payload.sessionType,
      liveMinutes: payload.liveMinutes,
      followups: payload.followups,
      liveBlocks: payload.liveBlocks,
      discord: payload.discord,
      preset: payload.preset,
      holdKey: payload.holdKey,
    }),
    [payload]
  );

  return (
    <section className="relative isolate min-h-screen py-8 md:py-10 text-white">
      {/* === Background (darker + brand glows) === */}
      <div className="absolute inset-0 -z-10 pointer-events-none isolate">
        {/* Deep navy to black */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#060914_0%,#04060e_100%)]" />

        {/* Subtle vignette for depth */}
        <div className="absolute inset-0 [mask-image:radial-gradient(70%_70%_at_50%_40%,black,transparent)] bg-black/70" />

        {/* Ambient anchors (blue left / orange right) */}
        <div className="absolute -left-24 top-[18%] h-[46rem] w-[46rem] rounded-full blur-3xl opacity-25 bg-[radial-gradient(circle_at_center,#69A8FF_0%,transparent_65%)]" />
        <div className="absolute right-[-16%] bottom-[-8%] h-[42rem] w-[42rem] rounded-full blur-3xl opacity-15 bg-[radial-gradient(circle_at_center,#ff7a1a_0%,transparent_70%)]" />

        {/* Grid + noise */}
        <div className="absolute inset-0 hud-grid opacity-20" />
        <div className="absolute inset-0 noise opacity-25" />
      </div>

      {/* === Content === */}
      <div className="relative z-0 mx-auto w-full max-w-6xl px-6 md:px-8">
        <div className="grid lg:grid-cols-[1.05fr_auto_.95fr] gap-8 items-start min-h-[70vh]">
          {/* Left column — Useful info (no extra bg wrappers) */}
          <UsefulToKnow />

          {/* Divider (kept light so it doesn't steal focus) */}
          <div className="hidden lg:flex items-stretch mx-2 px-4">
            <div className="w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
          </div>

          {/* Right column — primary floating card */}
          <div className="w-[400px] lg:justify-self-end relative z-0">
            <CheckoutPanel
              payload={payload}
              breakdown={breakdown}
              stripePromise={stripePromise}
              appearance={appearanceDarkBrand}
              payloadForBackend={payloadForBackend}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
