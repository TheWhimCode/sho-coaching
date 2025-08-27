// src/app/checkout/CheckoutClient.tsx
"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import UsefulToKnow from "@/pages/customization/checkout/lcolumn/UsefulToKnow";
import { buildBreakdown } from "@/pages/customization/checkout/rcolumn/checkoutSteps/stepcomponents/buildBreakdown";
import CheckoutPanel from "@/pages/customization/checkout/rcolumn/CheckoutPanel";
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
  const spKey = sp?.toString() ?? ""; // stable dep for memos

  // helpers (safe when sp is null)
  const getStr = (k: string, fallback = "") => sp?.get(k) ?? fallback;
  const getNum = (k: string, fallback: number) => {
    const v = sp?.get(k);
    if (v == null) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const payload = useMemo(() => {
    const liveBlocks = getNum("liveBlocks", 0);
    const liveMinRaw = sp?.get("liveMin");
    const liveMinutesRaw = sp?.get("liveMinutes");

    const baseMinutes = deriveBaseMinutes({
      liveMinParam: liveMinRaw ? Number(liveMinRaw) : null,
      liveMinutesParam: liveMinutesRaw ? Number(liveMinutesRaw) : null,
      liveBlocks,
    });

    const totalMins = mergedMinutes(baseMinutes, liveBlocks);

    return {
      slotId: getStr("slotId"),
      sessionType: getStr("sessionType", "Session"),
      baseMinutes,
      liveMinutes: totalMins,
      followups: getNum("followups", 0),
      liveBlocks,
      discord: getStr("discord"),
      preset: getStr("preset", "custom"),
      holdKey: getStr("holdKey"),
    };
  }, [spKey]); // recompute when URL params change

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
      {/* === Background (calm black + faint glows) === */}
      <div className="absolute inset-0 -z-10 pointer-events-none isolate">
        {/* Deep navy → black */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#05070f_0%,#020309_100%)]" />
        {/* Soft vignette for focus */}
        <div className="absolute inset-0 [mask-image:radial-gradient(75%_75%_at_50%_40%,black,transparent)] bg-black/70" />
        {/* Ambient brand anchors (very soft) */}
        <div className="absolute -left-40 top-[25%] h-[38rem] w-[38rem] rounded-full blur-[160px] opacity-10 bg-[radial-gradient(circle_at_center,#69A8FF_0%,transparent_70%)]" />
        <div className="absolute right-[-18%] bottom-[-10%] h-[34rem] w-[34rem] rounded-full blur-[160px] opacity-10 bg-[radial-gradient(circle_at_center,#ff7a1a_0%,transparent_75%)]" />
      </div>

      {/* === Content === */}
      <div className="relative z-0 mx-auto w-full max-w-6xl px-6 md:px-8">
        <div className="grid lg:grid-cols-[1.05fr_auto_.95fr] gap-8 items-start min-h-[70vh]">
          {/* Left column — Useful info */}
          <UsefulToKnow />

          {/* Divider */}
          <div className="hidden lg:flex items-stretch mx-2 px-4">
            <div className="w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
          </div>

          {/* Right column — checkout card */}
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
