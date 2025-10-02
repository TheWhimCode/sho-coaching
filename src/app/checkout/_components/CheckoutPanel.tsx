"use client";

import { useCheckoutFlow } from "@/app/checkout/_components/checkout-steps/useCheckoutFlow";
import CheckoutSteps from "@/app/checkout/_components/checkout-steps/CheckoutSteps";
import SessionBlock from "@/app/coaching/[preset]/_hero-components/SessionBlock";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";
import { FooterProvider, useFooter } from "@/app/checkout/_components/checkout-steps/FooterContext";
import { AnimatePresence, motion } from "framer-motion";

function PanelFooter({ step, dir }: { step: number; dir: 1 | -1 }) {
  const [footer] = useFooter();
  // button animation variants
  const variants = {
    enter: (d: 1 | -1) => ({ x: d * 40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: 1 | -1) => ({ x: d * -40, opacity: 0 }),
  };

  return (
    <div className="pt-3 px-1 pb-[env(safe-area-inset-bottom)] md:pb-0">
      <div className="min-h-[52px]">
        <AnimatePresence custom={dir} mode="wait" initial={false}>
          {!footer.hidden && (
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <PrimaryCTA
                type="button"
                disabled={footer.disabled || footer.loading}
                className="px-5 py-3 text-base w-full"
                onClick={() => footer.onClick?.()}
              >
                {footer.loading ? "Checking…" : footer.label ?? "Continue"}
              </PrimaryCTA>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function CheckoutPanel(props: Parameters<typeof useCheckoutFlow>[0]) {
  const flow = useCheckoutFlow(props);
  const { payload, breakdown, selectedStart } = flow;

  return (
    <FooterProvider>
      {/* Mobile: fullscreen overlay; Desktop: fills the fixed height from client */}
      <div
        className="
          fixed inset-0 z-40 w-screen h-[100svh]  
          md:static md:inset-auto md:z-auto md:w-full md:h-full md:rounded-2xl
        "
      >
        {/* Background / halo */}
        <div
          aria-hidden
          className="
            absolute inset-0 md:rounded-2xl md:overflow-hidden
            bg-[linear-gradient(135deg,#11182a_0%,#0e1526_45%,#0c1322_100%)]
            md:border md:border-[rgba(146,180,255,0.12)]
            md:ring-1 md:ring-[rgba(146,180,255,0.14)]
            md:shadow-[0_12px_40px_rgba(0,0,0,0.5)]
          "
        >
          <span
            className="
              pointer-events-none absolute inset-0
              bg-[radial-gradient(120%_120%_at_50%_0%,rgba(105,168,255,0.25),transparent_60%)]
              opacity-100 blur-[14px]
              md:rounded-2xl
            "
          />
        </div>

        {/* Content column — FULL HEIGHT */}
        <div
          className="
            relative flex h-full flex-col
            overflow-y-auto scrollbar-none
            px-6 py-6 md:p-6
          "
        >
          {/* Top + Steps fill all remaining space */}
          <div className="flex-1 min-h-0 flex flex-col space-y-2">
            <SessionBlock
              layoutId="session-block"
              minutes={payload.baseMinutes}
              liveBlocks={payload.liveBlocks}
              followups={payload.followups}
              priceEUR={breakdown?.total ?? 0}
              isActive
              className="mb-6 md:mb-6 relative"
              selectedDate={selectedStart}
            />

            <div className="-mx-6 md:-mx-6 h-px bg-[rgba(146,180,255,0.16)]" />

            {/* Steps stage — FULL HEIGHT (within flex-1) */}
            <div className="relative flex-1 min-h-0">
              <CheckoutSteps flow={flow} />
            </div>
          </div>

          {/* Bottom footer (CTA + chips) pinned by flex layout */}
          <PanelFooter step={flow.step} dir={flow.dir} />

          {/* Chips BELOW the CTA (hidden on mobile) */}
          <div className="hidden md:flex items-center gap-3 pt-4 text-white/75">
            <span className="inline-flex items-center gap-1 text-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="text-violet-400">
                <path d="M12 2 3 7l9 5 9-5-9-5Z" fill="currentColor" opacity=".9" />
                <path d="M3 7v10l9 5V12L3 7Z" fill="currentColor" opacity=".65" />
                <path d="M21 7v10l-9 5V12l9-5Z" fill="currentColor" opacity=".5" />
              </svg>
              3D Secure ready
            </span>
            <span className="inline-flex items-center gap-1 text-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" className="text-blue-400">
                <path d="M12 2 4 6v6c0 4.2 2.7 8 8 10 5.3-2 8-5.8 8-10V6l-8-4Z" fill="currentColor" />
              </svg>
              Buyer protection
            </span>
          </div>
        </div>
      </div>
    </FooterProvider>
  );
}
