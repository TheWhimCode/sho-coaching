// src/app/checkout/CheckoutClient.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import UsefulToKnow from "@/pages/customization/checkout/lcolumn/UsefulToKnow";
import { buildBreakdown } from "@/pages/customization/checkout/rcolumn/checkoutSteps/stepcomponents/buildBreakdown";
import CheckoutPanel from "@/pages/customization/checkout/rcolumn/CheckoutPanel";
import { appearanceDarkBrand } from "@/lib/checkout/stripeAppearance";

import { loadStripe } from "@stripe/stripe-js";
import { motion, type Variants, useAnimationControls } from "framer-motion";

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

/** === Animations (subtle, smooth, product-like) === */
const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

const pageSlide: Variants = {
  hidden: { x: 28, opacity: 0 },
  show: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: EASE },
  },
};

const rightCol: Variants = {
  hidden: { y: 14, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.42, ease: EASE },
  },
};

/** Background brightness overlay */
const bgDim: Variants = {
  bright: { opacity: 0.8 },
  dim: {
    opacity: 0.25,
    transition: { duration: 0.42, ease: EASE },
  },
};

export default function CheckoutClient() {
  const sp = useSearchParams();
  const spKey = sp?.toString() ?? "";

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
  }, [spKey]);

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

  /** Orchestrate sequence */
  const pageCtrl = useAnimationControls();
  const rightCtrl = useAnimationControls();
  const bgCtrl = useAnimationControls();

  useEffect(() => {
    (async () => {
      await pageCtrl.start("show");
      await Promise.all([rightCtrl.start("show"), bgCtrl.start("dim")]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.section
      variants={pageSlide}
      initial="hidden"
      animate={pageCtrl}
      className="
        relative isolate min-h-screen
        pt-12 md:pt-16 lg:pt-20 pb-10
        text-white
        overflow-x-hidden overflow-y-hidden
      "
    >
      {/* === Background: very dark navy/azure/purple === */}
      <div className="absolute inset-0 -z-10 pointer-events-none isolate overflow-hidden">
        {/* Deepened base gradient (navy) */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#070b16_0%,#060a15_55%,#050913_100%)]" />
        {/* Soft vignette */}
        <div className="absolute inset-0 [mask-image:radial-gradient(78%_78%_at_50%_40%,black,transparent)] bg-black/75" />
        {/* Azure wash (L) */}
        <div className="absolute -left-40 top-[24%] h-[40rem] w-[40rem] rounded-full blur-[160px] opacity-15 bg-[radial-gradient(circle_at_center,#7FB6FF_0%,#4c7dff_35%,transparent_72%)]" />
        {/* Purple wash (R) */}
        <div className="absolute right-[-18%] bottom-[-8%] h-[36rem] w-[36rem] rounded-full blur-[160px] opacity-15 bg-[radial-gradient(circle_at_center,#7a5cff_0%,#5a46e8_35%,transparent_75%)]" />
        {/* Ultra-low conic edge tint */}
        <div className="absolute inset-0 opacity-[0.06] bg-[conic-gradient(from_200deg_at_50%_50%,#203a86_0deg,#7fb6ff_120deg,#7a5cff_240deg,#203a86_360deg)]" />

        {/* Brightness overlay that we DIM after the page slide finishes */}
        <motion.div
          variants={bgDim}
          initial="bright"
          animate={bgCtrl}
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 60% at 50% 35%, rgba(127,182,255,0.30) 0%, rgba(124,95,255,0.22) 45%, rgba(0,0,0,0) 80%)",
            mixBlendMode: "screen" as any,
          }}
        />
      </div>

      {/* === Content === */}
      <div className="relative z-0 mx-auto w-full max-w-6xl px-6 md:px-8">
        <div className="flex justify-center">
          <div className="inline-grid lg:grid-cols-[minmax(0,1fr)_auto_420px] gap-8 items-start lg:justify-items-stretch min-h-[70vh]">
            {/* Left column */}
            <div className="w-full lg:max-w-none xl:max-w-[820px]">
              <UsefulToKnow />
            </div>

            {/* Divider */}
            <div className="hidden lg:flex items-stretch mx-2 px-4">
              <div className="w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
            </div>

            {/* Right column (fixed width, aligned right) */}
            <motion.div
              variants={rightCol}
              initial="hidden"
              animate={rightCtrl}
              className="w-full lg:w-[420px] relative z-0 lg:justify-self-end"
            >
              <CheckoutPanel
                payload={payload}
                breakdown={breakdown}
                stripePromise={stripePromise}
                appearance={appearanceDarkBrand}
                payloadForBackend={payloadForBackend}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
