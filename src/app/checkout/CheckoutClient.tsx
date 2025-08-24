// src/app/checkout/CheckoutClient.tsx
"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import UsefulToKnow from "@/components/checkout/UsefulToKnow";
import { buildBreakdown } from "@/components/checkout/buildBreakdown";
import CheckoutPanel from "@/components/checkout/CheckoutPanel";
import { appearanceDarkBrand } from "@/lib/checkout/stripeAppearance";

import { loadStripe, type Appearance } from "@stripe/stripe-js";

/* ===================
   Stripe client + appearance
   =================== */
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

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
   Helpers (robust decode)
   =================== */
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

/* ===================
   Main
   =================== */
export default function CheckoutClient() {
  const sp = useSearchParams();

  // Build the payload once from URL params (robust to missing values)
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
      liveMinutes: totalMins, // combined for pricing/scheduling
      followups: Number(sp.get("followups") ?? 0) || 0,
      liveBlocks,
      discord: String(sp.get("discord") ?? ""),
      preset: String(sp.get("preset") ?? "custom"),
      holdKey: String(sp.get("holdKey") ?? ""),
    };
  }, [sp]);

  // Price breakdown from combined minutes
  const breakdown = useMemo(
    () => buildBreakdown(payload.liveMinutes, payload.followups, payload.liveBlocks),
    [payload.liveMinutes, payload.followups, payload.liveBlocks]
  );

  // The payload we POST to the backend (Stripe intent route)
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
    <section className="relative isolate min-h-screen py-8 md:py-10">
      {/* background — brighter navy + grid + noise (no auroras) */}
      <div className="absolute inset-0 -z-10 pointer-events-none isolate">
        {/* brighter base gradient so glass blur reads */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#162a4c_0%,#0e1f3a_100%)]" />
        {/* overlays */}
        <div className="absolute inset-0 hud-grid opacity-30" />
        <div className="absolute inset-0 noise opacity-20" />
      </div>

      {/* content */}
      <div className="relative z-0 mx-auto w-full max-w-6xl px-6 md:px-8">
        <div className="grid lg:grid-cols-[1.1fr_auto_.9fr] gap-8 items-start min-h-[70vh]">
          {/* Left column */}
          <div className="relative">
            <UsefulToKnow />
          </div>

          {/* Divider */}
          <div className="hidden lg:flex items-stretch mx-2 px-4">
            <div className="w-px bg-gradient-to-b from-transparent via-white/25 to-transparent" />
          </div>

          {/* Right column (the panel that slides steps) */}
          <div className="w-full max-w-xl lg:justify-self-end relative z-0">
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
