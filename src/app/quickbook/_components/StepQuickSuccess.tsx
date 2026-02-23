// src/app/quickbook/_components/StepQuickSuccess.tsx
"use client";

import * as React from "react";
import OutlineCTA from "@/app/_components/small/buttons/OutlineCTA";
import type { DiscordIdentity } from "./types";

function normalizeRiotTag(v: string) {
  return v.trim().replace(/\s*#\s*/g, "#");
}

type Props = {
  riotTag: string;
  discordIdentity: DiscordIdentity;
};

export default function StepQuickSuccess({
  riotTag,
  discordIdentity,
}: Props) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-6 pt-6 pb-3">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/60">
          Booking confirmed
        </div>
        <div className="text-2xl font-semibold text-white/90">
          Success 🎉
        </div>
        <div className="mt-2 text-sm text-white/70">
          You’re booked as{" "}
          <span className="text-white/90 font-semibold">
            {normalizeRiotTag(riotTag)}
          </span>{" "}
          and Discord{" "}
          <span className="text-white/90 font-semibold">
            {discordIdentity.username ?? discordIdentity.id}
          </span>.
        </div>
      </div>



      {/* Footer */}
      <div className="px-6 py-4 border-t border-[rgba(146,180,255,.18)]">
        <OutlineCTA
          className="w-full h-11"
          onClick={() => (window.location.href = "/")}
        >
          Back to website
        </OutlineCTA>
      </div>
    </div>
  );
}