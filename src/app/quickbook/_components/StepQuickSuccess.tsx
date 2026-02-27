// src/app/quickbook/_components/StepQuickSuccess.tsx
"use client";

import * as React from "react";
import OutlineCTA from "@/app/_components/small/buttons/OutlineCTA";

type Props = {
  bookedStartISO: string | null;
};

function formatBookingTime(iso: string) {
  const d = new Date(iso);

  const dateLine = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);

  const timeLine = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "your local time";

  return { dateLine, timeLine, tz };
}

export default function StepQuickSuccess({ bookedStartISO }: Props) {
  const formatted = React.useMemo(() => {
    if (!bookedStartISO) return null;
    return formatBookingTime(bookedStartISO);
  }, [bookedStartISO]);

  return (
    <div className="h-full min-h-0 flex pt-40 pb-60 justify-center md:px-4">
      <div className="w-full max-w-xl rounded-2xl ring-1 ring-[rgba(146,180,255,.20)] bg-[rgba(12,22,44,.55)] supports-[backdrop-filter]:backdrop-blur-md p-6 sm:p-8 text-center">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">
          Booking confirmed
        </div>

        <div className="mt-2 text-3xl font-semibold text-white/90">
          Success 🎉
        </div>

        <div className="mt-5">
          <div className="text-base text-white/70">Your session starts at</div>

          <div className="mt-2 text-4xl sm:text-5xl font-semibold text-white">
            {formatted ? formatted.timeLine : "—"}
          </div>

          <div className="mt-2 text-base text-white/80">
            {formatted ? formatted.dateLine : "Loading time…"}
          </div>
        </div>

        <div className="mt-8">
          <OutlineCTA className="w-full h-11" onClick={() => (window.location.href = "/")}>
            Back to website
          </OutlineCTA>
        </div>
      </div>
    </div>
  );
}