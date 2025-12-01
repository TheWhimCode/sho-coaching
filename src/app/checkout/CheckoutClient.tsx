// src/app/checkout/CheckoutClient.tsx
"use client";

import { useMemo, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import UsefulToKnow from "@/app/checkout/_components/UsefulToKnow";
import { buildBreakdown } from "@/lib/checkout/buildBreakdown";
import CheckoutPanel from "@/app/checkout/_components/CheckoutPanel";
import { appearanceDarkBrand } from "@/lib/checkout/stripeAppearance";

import { loadStripe } from "@stripe/stripe-js";
import { motion, type Variants } from "framer-motion";

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

/** desktop animation */
const rightCol: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.32, ease: [0.22, 0.61, 0.36, 1] } },
};

/** detect desktop viewport */
function useIsDesktop() {
  const [isDesk, set] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = () => set(mql.matches);
    handler();
    mql.addEventListener?.("change", handler);
    return () => mql.removeEventListener?.("change", handler);
  }, []);
  return isDesk;
}

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
      slotIds: getStr("slotIds"),
      sessionType: getStr("sessionType", "Session"),
      baseMinutes,
      liveMinutes: totalMins,
      followups: getNum("followups", 0),
      liveBlocks,
      discordId: getStr("discordId"),
      discordName: getStr("discordName"),

      // ⭐ FIX: we now read productId
      productId: getStr("productId", ""),

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
      slotIds: payload.slotIds,
      sessionType: payload.sessionType,
      liveMinutes: payload.liveMinutes,
      followups: payload.followups,
      liveBlocks: payload.liveBlocks,
      discordId: payload.discordId,
      discordName: payload.discordName,
      preset: payload.preset,
      holdKey: payload.holdKey,

      // ⭐ FIX: forward productId
      productId: payload.productId,
    }),
    [payload]
  );

  const isDesktop = useIsDesktop();
  const RightCol: any = isDesktop ? motion.div : "div";

  return (
    <section
      className="
        relative isolate min-h-dvh pt-8 md:pt-10 lg:pt-12 pb-10 text-white
        overflow-x-hidden lg:overflow-y-hidden
      "
    >
      {/* Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none isolate overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#05070f_0%,#070c18_40%,#0c1528_70%,#1c2f5c_100%)]" />
        <div className="absolute inset-0 [mask-image:radial-gradient(80%_80%_at_50%_50%,black,transparent)] bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-0 mx-auto w-full max-w-6xl px-6 md:px-8">
        <div className="flex justify-center">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_420px] gap-8 items-start lg:justify-items-stretch min-h-[70vh]">
            <div className="hidden md:block relative w-full mt-12 lg:max-w-none xl:max-w-[820px] lg:-ml-6 xl:-ml-12 2xl:-ml-20">
              <UsefulToKnow />
            </div>

            <div className="hidden lg:flex items-stretch mx-2 px-4">
              <div className="w-px bg-gradient-to-b from-transparent via-white/15 to-transparent" />
            </div>

            <RightCol
              {...(isDesktop
                ? { variants: rightCol, initial: "hidden", animate: "show" }
                : {})}
              className="w-full mx-auto lg:w-[400px] relative z-0 lg:justify-self-end lg:h-[730px]"
            >
              <CheckoutPanel
                payload={payload}
                breakdown={breakdown}
                stripePromise={stripePromise}
                appearance={appearanceDarkBrand}
                payloadForBackend={payloadForBackend}
              />
            </RightCol>
          </div>
        </div>
      </div>
    </section>
  );
}
