"use client";

import { useState } from "react";
import { useCheckoutFlow } from "@/app/checkout/_components/checkout-steps/useCheckoutFlow";
import CheckoutSteps from "@/app/checkout/_components/checkout-steps/CheckoutSteps";
import SessionBlock from "@/app/coaching/[preset]/_hero-components/SessionBlock";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";
import { FooterProvider, useFooter } from "@/app/checkout/_components/checkout-steps/FooterContext";
import { AnimatePresence, motion } from "framer-motion";
import type { ProductId } from "@/engine/session";
import { computePriceWithProduct } from "@/engine/session";

// ⭐ NEW imports
import {
  clamp,
  totalMinutes,
  titlesByPreset,
  type SessionConfig,
} from "@/engine/session";

function BottomBar({
  step,
  dir,
  flow,
  session,
}: {
  step: number;
  dir: 1 | -1;
  flow: ReturnType<typeof useCheckoutFlow>;
  session: SessionConfig

}) {
  const [footer, setFooter] = useFooter();
  const show = !footer.hidden;

  const [coupon, setCoupon] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ type: "error" | "success"; msg: string } | null>(null);

const { priceEUR } = computePriceWithProduct(session);
const baseTotal = priceEUR;
const discountedTotal = priceEUR - (flow.couponDiscount ?? 0);

  const blockedByWaiver = flow.step === 2 && !flow.waiver;
  const disabled = footer.disabled || footer.loading || blockedByWaiver;

  const couponLocked = !!flow.clientSecret;

  const handleApplyCoupon = async () => {
    const res = await fetch("/api/checkout/coupon/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon, studentId: flow.studentId }),
    });

    const data = await res.json();

    if (!data?.valid) {
      setCouponMsg({
        type: "error",
        msg:
          data.reason === "wrong-student"
            ? "Please use your own coupon"
            : "Invalid code — check spelling",
      });
      return;
    }

    if (flow.bookingId) {
      await fetch("/api/checkout/coupon/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: flow.bookingId,
          code: coupon,
          discount: data.discount,
        }),
      });
    }

    setCouponMsg({ type: "success", msg: `${coupon} applied!` });
    flow.applyCoupon(data.discount, coupon);
    flow.setCouponCode(coupon);
  };

  const variants = {
    enter: (d: 1 | -1) => ({ x: d * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: 1 | -1) => ({ x: d * -40, opacity: 0 }),
  };

  return (
    <div className="pt-0 px-1 pb-[max(env(safe-area-inset-bottom),1rem)] md:pb-0">
      <div id="hidden-payment-element" style={{ display: "none" }} />

      <AnimatePresence custom={dir} mode="wait" initial={false}>
        {show && (
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full"
          >
            {flow.step === 2 && (
              <>
                <div className="relative h-[38px] mb-2">
                  {couponMsg && (
                    <div
                      className={`absolute -top-5 right-0 text-xs font-semibold whitespace-nowrap ${
                        couponMsg.type === "error"
                          ? "text-red-400"
                          : "text-[var(--color-lightblue)]"
                      }`}
                    >
                      {couponMsg.msg}
                    </div>
                  )}
                  <div className="flex items-center gap-2 h-full">
                    <input
                      type="text"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      placeholder="Coupon"
                      disabled={couponLocked}
                      className="bg-white/[0.06] text-sm text-white/80 rounded-md px-3 py-2 w-full
                        placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
                    />
                    <button
                      type="button"
                      disabled={couponLocked}
                      className="text-sm px-3 py-2 bg-white/[0.07] rounded-md text-white/80
                        hover:bg-white/[0.12] transition disabled:opacity-40"
                      onClick={handleApplyCoupon}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="shrink-0 pt-4 pb-1 border-t border-white/10 space-y-4">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-white">Total</span>
                    <div className="flex items-center gap-2">
                      {flow.couponDiscount > 0 ? (
                        <>
                          <motion.span
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[var(--color-lightblue)] text-sm font-semibold"
                          >
                            €{discountedTotal.toFixed(0)}
                          </motion.span>
                          <motion.span
                            initial={{ opacity: 0, x: 4 }}
                            animate={{ opacity: 0.8, x: 0 }}
                            className="line-through text-white/80 text-sm"
                          >
                            €{baseTotal.toFixed(0)}
                          </motion.span>
                        </>
                      ) : (
                        <span className="text-white">€{baseTotal.toFixed(0)}</span>
                      )}
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-[13px] text-white/80">
                    <input
                      type="checkbox"
                      checked={flow.waiver}
                      onChange={(e) => flow.setWaiver(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#fc8803]"
                    />
                    <span>
                      I request immediate service and accept that my{" "}
                      <a
                        href="/withdrawal"
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-white"
                      >
                        14-day withdrawal right
                      </a>{" "}
                      ends with full performance.
                    </span>
                  </label>

                  <p className="text-[11px] leading-snug text-white/60">
                    By clicking{" "}
                    <span className="text-white/80 font-medium">Pay now</span>,
                    you agree to our{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-white"
                    >
                      Terms
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:text-white"
                    >
                      Privacy Policy
                    </a>.
                  </p>
                </div>
              </>
            )}

            <div className="h-12 flex items-center">
              <PrimaryCTA
                type="button"
                disabled={disabled}
                className="px-5 py-3 text-base w-full"
onClick={async () => {
  if (disabled || footer.loading) return;

  // STEP LOGIC: If not on final step, just advance.
  if (flow.step < 2) {
    footer.onClick?.();  // Usually goNext or chooseAndGo
    return;
  }

  // PAYMENT LOGIC — only runs on step 2
  setFooter((f: any) => ({ ...f, loading: true }));

  try {
    const stripe = await flow.stripePromise;
    if (!stripe) return;

    if (flow.payMethod === "card") {
      const resp = await fetch("/api/stripe/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "card",
          amountCents: Math.round(discountedTotal * 100),
              bookingId: flow.bookingId,   // ✅ FIX

        }),
      });

      const data = await resp.json().catch(() => null);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      console.error("Failed to create Checkout Session", data);
      return;
    }

    if (["paypal", "klarna", "revolut_pay"].includes(flow.payMethod)) {
      const secret =
        flow.clientSecret ?? (await flow.createPaymentIntent?.());
      if (!secret) {
        console.error("Missing client secret");
        return;
      }

      const elements = stripe.elements({ clientSecret: secret });
      const paymentElement = elements.create("payment");
      paymentElement.mount("#hidden-payment-element");

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: window.location.origin + "/checkout/success" },
      });

      if (error) console.error("Payment failed:", error.message);
    }
  } catch (err) {
    console.error("Payment handling failed:", err);
  } finally {
    setFooter((f: any) => ({ ...f, loading: false }));
  }
}}


                aria-disabled={disabled}
              >
                {footer.loading ? "Just a moment…" : footer.label ?? "Continue"}
              </PrimaryCTA>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CheckoutPanel(props: Parameters<
  typeof useCheckoutFlow
>[0]) {
  const flow = useCheckoutFlow(props);
  const { payload, breakdown, selectedStart } = flow;

  // ⭐ Build session as before
  const session = clamp({
    liveMin: payload.baseMinutes,
    liveBlocks: payload.liveBlocks,
    followups: payload.followups,
    productId: (payload.productId ?? undefined) as ProductId | undefined,
  });

  // ⭐ The fix — never recalculate preset on checkout
  const preset = payload.preset as any;

  return (
    <FooterProvider>
      <div
        className="
          fixed inset-0 z-40 w-screen h-[100svh] supports-[height:100dvh]:h-dvh
          md:static md:inset-auto md:z-auto md:w-full md:h-full md:rounded-2xl
        "
      >
        <div
          className="
            relative flex flex-col h-full overflow-y-auto overscroll-y-contain scrollbar-none
            bg-[linear-gradient(135deg,#11182a_0%,#0e1526_45%,#0c1322_100%)]
            md:rounded-2xl md:border md:border-[rgba(146,180,255,0.12)]
            md:ring-1 md:ring-[rgba(146,180,255,0.14)]
            md:shadow-[0_12px_40px_rgba(0,0,0,0.5)]
            px-6 pt-6 md:pb-6 md:p-6
          "
        >
          <span
            aria-hidden
            className="
              pointer-events-none absolute inset-0
              bg-[radial-gradient(120%_120%_at_50%_0%,rgba(105,168,255,0.25),transparent_60%)]
              opacity-100 blur-[14px]
              md:rounded-2xl
            "
          />

          <div className="flex flex-col flex-1 space-y-4 relative z-10 md:min-h-0 md:h-full">

            <SessionBlock
              layoutId="session-block"
              session={session}
              preset={preset}
              isActive
              className="mb-6 relative"
              selectedDate={selectedStart}
            />

            <div className="-mx-6 md:-mx-6 h-px bg-[rgba(146,180,255,0.16)]" />

            <div className="flex-1 min-h-0 flex flex-col">
              <CheckoutSteps flow={flow} />
            </div>

<BottomBar step={flow.step} dir={flow.dir} flow={flow} session={session} />

            <div className="hidden md:flex items-center gap-3 text-white/75">
              <span className="inline-flex items-center gap-1 text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" className="text-violet-400">
                  <path d="M12 2 3 7l9 5 9-5-9-5Z" fill="currentColor" opacity=".9" />
                  <path d="M3 7v10l9 5V12L3 7Z" fill="currentColor" opacity=".65" />
                  <path d="M21 7v10l-9 5V12l9-5Z" fill="currentColor" opacity=".5" />
                </svg>
                3D Secure ready
              </span>
              <span className="inline-flex items-center gap-1 text-xs">
                <svg width="14" height="14" viewBox="0 0 24 24" className="text-blue-400">
                  <path d="M12 2 4 6v6c0 4.2 2.7 8 8 10 5.3-2 8-5.8 8-10V6l-8-4Z" fill="currentColor" />
                </svg>
                Buyer protection
              </span>
            </div>
          </div>
        </div>
      </div>
    </FooterProvider>
  );
}
