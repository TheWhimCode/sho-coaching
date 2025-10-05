// src/app/checkout/_components/CheckoutPanel.tsx
"use client";

import { useCheckoutFlow } from "@/app/checkout/_components/checkout-steps/useCheckoutFlow";
import CheckoutSteps from "@/app/checkout/_components/checkout-steps/CheckoutSteps";
import SessionBlock from "@/app/coaching/[preset]/_hero-components/SessionBlock";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";
import { FooterProvider, useFooter } from "@/app/checkout/_components/checkout-steps/FooterContext";
import { AnimatePresence, motion } from "framer-motion";

function BottomBar({
  step,
  dir,
  flow,
}: {
  step: number;
  dir: 1 | -1;
  flow: ReturnType<typeof useCheckoutFlow>;
}) {
  const [footer] = useFooter();
  const show = !footer.hidden;

  // Match step animation exactly
  const variants = {
    enter: (d: 1 | -1) => ({ x: d * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: 1 | -1) => ({ x: d * -40, opacity: 0 }),
  };

  // ✅ Block the CTA on step 3 unless waiver is accepted
  const blockedByWaiver = flow.step === 3 && !flow.waiver;
  const disabled = footer.disabled || footer.loading || blockedByWaiver;

  return (
    <div className="pt-0 px-1 pb-[max(env(safe-area-inset-bottom),1rem)] md:pb-0">
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
            {/* Summary block only on Step 3; animates together with CTA */}
            {flow.step === 3 && (
              <div className="shrink-0 pt-4 pb-1 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-white">Total</span>
                  <span className="text-white">€{(flow.breakdown?.total ?? 0).toFixed(0)}</span>
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
                  By clicking <span className="text-white/80 font-medium">Pay now</span>, you agree to our{" "}
                  <a href="/terms" target="_blank" rel="noreferrer" className="underline hover:text-white">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" target="_blank" rel="noreferrer" className="underline hover:text-white">
                    Privacy Policy
                  </a>.
                </p>
              </div>
            )}

            {/* Primary CTA (in same animation group) */}
            <div className="h-12 flex items-center">
              <PrimaryCTA
                type="button"
                disabled={disabled}
                className="px-5 py-3 text-base w-full"
                onClick={() => {
                  if (disabled) return;
                  footer.onClick?.();
                }}
                aria-disabled={disabled}
              >
                {footer.loading ? "Checking…" : footer.label ?? "Continue"}
              </PrimaryCTA>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CheckoutPanel(props: Parameters<typeof useCheckoutFlow>[0]) {
  const flow = useCheckoutFlow(props);
  const { payload, breakdown, selectedStart } = flow;

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
              minutes={payload.baseMinutes}
              liveBlocks={payload.liveBlocks}
              followups={payload.followups}
              priceEUR={breakdown?.total ?? 0}
              isActive
              className="mb-6 relative"
              selectedDate={selectedStart}
            />

            <div className="-mx-6 md:-mx-6 h-px bg-[rgba(146,180,255,0.16)]" />

            {/* Steps fill remaining height on all viewports */}
            <div className="flex-1 min-h-0 flex flex-col">
              <CheckoutSteps flow={flow} />
            </div>

            {/* Animated bottom summary + CTA */}
            <BottomBar step={flow.step} dir={flow.dir} flow={flow} />

            {/* Static desktop-only chips (not animated) */}
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
