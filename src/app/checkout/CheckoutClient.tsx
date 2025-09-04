"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import UsefulToKnow from "@/app/checkout/_components/UsefulToKnow";
import { buildBreakdown } from "@/lib/checkout/buildBreakdown";
import CheckoutPanel from "@/app/checkout/_components/CheckoutPanel";
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
  return Math.min(MAX, Math.max(MIN, baseMinutes + liveBlocks * LIVEBLOCK_MIN));
}

/** === Animations (subtle, smooth, product-like) === */
const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

const pageSlide: Variants = {
  hidden: { x: 28, opacity: 0 },
  show: { x: 0, opacity: 1, transition: { duration: 0.5, ease: EASE } },
};

const rightCol: Variants = {
  hidden: { y: 14, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.42, ease: EASE } },
};

export default function CheckoutClient() {
  const sp = useSearchParams();
  const spKey = sp?.toString() ?? "";

  const payload = useMemo(() => {
    const getStr = (k: string, fallback = "") => sp?.get(k) ?? fallback;
    const getNum = (k: string, fallback: number) => {
      const v = sp?.get(k);
      if (v == null) return fallback;
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

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

  useEffect(() => {
    (async () => {
      await pageCtrl.start("show");
      await rightCtrl.start("show");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.section
      variants={pageSlide}
      initial="hidden"
      animate={pageCtrl}
      className="relative isolate min-h-screen pt-12 md:pt-16 lg:pt-20 pb-10 text-white overflow-x-hidden overflow-y-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none isolate overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#05070f_0%,#070c18_40%,#0c1528_70%,#16264a_100%)]" />
        <div className="absolute inset-0 [mask-image:radial-gradient(80%_80%_at_50%_50%,black,transparent)] bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-0 mx-auto w-full max-w-6xl px-6 md:px-8">
        <div className="flex justify-center">
          <div className="inline-grid lg:grid-cols-[minmax(0,1fr)_auto_420px] gap-8 items-start lg:justify-items-stretch min-h-[70vh]">
            <div className="w-full lg:max-w-none xl:max-w-[820px] lg:-ml-6 xl:-ml-12 2xl:-ml-20">
              <UsefulToKnow />
            </div>

            <div className="hidden lg:flex items-stretch mx-2 px-4">
              <div className="w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
            </div>

            <motion.div
              variants={rightCol}
              initial="hidden"
              animate={rightCtrl}
              className="w-full lg:w-[400px] relative z-0 lg:justify-self-end"
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
