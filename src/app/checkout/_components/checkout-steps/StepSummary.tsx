"use client";

import { useEffect } from "react";
import type { Breakdown } from "@/lib/checkout/buildBreakdown";
import { ArrowLeft } from "lucide-react";
import { useFooter } from "@/app/checkout/_components/checkout-steps/FooterContext";
import { clamp, computePriceWithProduct } from "@/engine/session";
import type { ProductId } from "@/engine/session/model/product";

type Method = "card" | "paypal" | "revolut_pay" | "klarna";

type Props = {
  goBack: () => void;
  payload: {
    baseMinutes: number;
    liveBlocks: number;
    followups: number;
productId?: ProductId | null;
  };
  breakdown: Breakdown;
  payMethod: Method;
  sessionBlockTitle: string;
};

export default function StepSummary({
  goBack,
  payload,
  breakdown: b,
  payMethod,
  sessionBlockTitle,
}: Props) {
  const [, setFooter] = useFooter();

  useEffect(() => {
    setFooter({
      label: "Pay now",
      disabled: false,
      loading: false,
      onClick: undefined,
      hidden: false,
    });
  }, [setFooter]);

  // build session correctly
  const session = clamp({
    liveMin: payload.baseMinutes,
    liveBlocks: payload.liveBlocks,
    followups: payload.followups,
productId: payload.productId ?? undefined,  });

  const { priceEUR } = computePriceWithProduct(session);
  const isBundle = !!payload.productId?.startsWith("rush");

  return (
    <div className="flex flex-col h-full md:pt-2">
      {/* Header */}
      <div className="mb-3">
        <div className="relative h-7 flex items-center justify-center">
          <button
            onClick={goBack}
            className="absolute left-0 inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="text-sm text-white/80">Order summary</div>
        </div>
        <div className="mt-2 border-t border-white/10" />
      </div>

      {/* Scrollable summary */}
      <div className="flex-1 min-h-0 overflow-y-auto px-1 space-y-3">
        <dl className="text-base space-y-3">

          {/* ✔ For bundles we override the whole breakdown */}
          {isBundle ? (
            <div className="flex items-center justify-between">
              <dt className="text-white/80">{sessionBlockTitle}</dt>
              <dd className="text-white/90">€{priceEUR.toFixed(0)}</dd>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <dt className="text-white/80">
                  ⬩ {payload.baseMinutes} min coaching
                </dt>
                <dd className="text-white/90">€{b.minutesEUR.toFixed(0)}</dd>
              </div>

              {payload.liveBlocks > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-white/80">
                    ⬩ {payload.liveBlocks * 45} min in-game coaching
                  </dt>
                  <dd className="text-white/90">
                    €{b.inGameEUR.toFixed(0)}
                  </dd>
                </div>
              )}

              {payload.followups > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-white/80">
                    ⬩ {payload.followups}× Follow-up
                  </dt>
                  <dd className="text-white/90">
                    €{b.followupsEUR.toFixed(0)}
                  </dd>
                </div>
              )}
            </>
          )}
        </dl>
      </div>
    </div>
  );
}
