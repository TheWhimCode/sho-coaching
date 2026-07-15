"use client";

import clsx from "clsx";
import PresetCards from "@/app/coaching/_coaching-components/cards";
import CoachingSalesUnavailableOverlay from "@/app/coaching/_coaching-components/CoachingSalesUnavailableOverlay";
import { COACHING_SALES_ENABLED } from "@/lib/coaching/coachingSales";

export default function CoachingPresetCardsSection({
  containerClassName = "max-w-6xl px-6",
  onFollowupInfo,
}: {
  containerClassName?: string;
  onFollowupInfo?: () => void;
}) {
  const salesEnabled = COACHING_SALES_ENABLED;

  return (
    <div className="relative">
      <div
        className={clsx(!salesEnabled && "pointer-events-none select-none blur-[6px] saturate-[0.82]")}
        {...(!salesEnabled ? { inert: true } : {})}
      >
        <PresetCards
          containerClassName={containerClassName}
          onFollowupInfo={onFollowupInfo}
          salesDisabled={!salesEnabled}
        />
      </div>
      {!salesEnabled ? <CoachingSalesUnavailableOverlay /> : null}
    </div>
  );
}
