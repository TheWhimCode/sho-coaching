"use client";

import React, { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import SquareButton from "@/app/_components/small/SquareButton";
import TransitionOverlay from "@/app/coaching/_coaching-components/components/OverlayTransition";

type Props = {
  className?: string;
  containerClassName?: string;
  customizeHref?: string;
  exampleHref?: string;
};

export default function FollowUp({
  className = "",
  containerClassName = "max-w-7xl",
  // default: jump to custom with the drawer open + follow-ups highlighted
  customizeHref = "/coaching/custom?base=45&followups=0&live=0&open=customize&focus=followups",
  exampleHref = "https://www.patreon.com/posts/azir-emerald-up-123493426",
}: Props) {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Let modifier/middle clicks behave like a normal link (new tab/window)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button === 1) return;

      // Use overlay then route
      e.preventDefault();
      if (!transitioning) setTransitioning(true);
    },
    [transitioning]
  );

  const handleOverlayComplete = useCallback(() => {
    router.push(customizeHref);
  }, [router, customizeHref]);

  return (
    <>
      {/* Transition curtain */}
      <TransitionOverlay active={transitioning} onComplete={handleOverlayComplete} duration={0.7} />

      <section className={`w-full ${className}`} aria-label="Follow-ups">
        <div className={`mx-auto w-full ${containerClassName}`}>
          {/* Content row */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14 items-start">
            {/* Left: 4:3 video placeholder */}
            <div className="md:col-span-6 order-last md:order-first">
              <div className="relative aspect-[4/3] rounded-2xl border border-white/10 bg-white/[.03] overflow-hidden">
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)" }}
                />
                <div className="absolute inset-0 grid place-items-center text-white/40 text-sm">
                  Video placeholder: Follow-up animation
                </div>
              </div>
            </div>

            {/* Right: explanation + CTA row */}
            <div className="md:col-span-6 order-first md:order-last">
              <p className="text-[10px] tracking-[0.22em] text-white/50 uppercase">Add-on service</p>
              <h3 className="mt-2 text-2xl md:text-3xl font-semibold">What is a Follow-up?</h3>
              <p className="mt-3 text-white/70 text-base md:text-lg max-w-[50ch]">
                After you’ve practiced what you learned in our session, request your follow-up. Whether it’s been 3 days or 3 months, just send me a game and I’ll record a 15-minute video with new insights, a progress review, and your next steps to keep improving.
              </p>

              {/* Moved subheader quote here */}
              <p className="mt-2 text-lg md:text-lg text-white/60 italic">
                — “Honestly, it felt like a second coaching session”
              </p>

              {/* CTA row: Add button (orange styled) + example square button */}
              <div className="mt-4 flex items-center justify-between gap-6 border-l-2 border-white/20 px-5 py-1.5 rounded-xl bg-white/[.02]">
                {/* Left: helper line on top + button */}
                <div className="flex-1 min-w-0 flex flex-col items-start justify-center">
                  <p className="text-sm md:text-base text-white mb-2">
                    You can add follow-ups through customization.
                  </p>
                  <div className="relative inline-block">
                    <span className="pointer-events-none absolute -inset-1 rounded-xl blur-md opacity-30 -z-10 bg-[radial-gradient(60%_100%_at_50%_50%,_rgba(255,179,71,.28),_transparent_70%)]" />
                    <a
                      href={customizeHref}
                      onClick={handleClick}
                      className="relative z-10 inline-flex items-center justify-center rounded-xl px-4 md:px-5 py-2.5 md:py-3 text-sm md:text-base font-semibold text-[#0A0A0A] bg-[#fc8803] hover:bg[#f8a81a] transition shadow-[0_10px_28px_rgba(245,158,11,.35)] ring-1 ring-[rgba(255,190,80,.55)]"
                      aria-busy={transitioning}
                    >
                      Add follow-ups
                    </a>
                  </div>
                </div>

                {/* Right: example square button with label on top */}
                <div className="flex flex-col items-center">
                  <span className="mb-1.5 text-[10px] tracking-[0.2em] text-white/60">EXAMPLE</span>
                  <SquareButton role="Mid" href={exampleHref} src="/images/squarebuttons/Azir2.png" size={80} />
                </div>
              </div>

              <p className="mt-5 text-[11px] text-white/50">
                Typically finished in 24–72h. Private MP4 link.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
