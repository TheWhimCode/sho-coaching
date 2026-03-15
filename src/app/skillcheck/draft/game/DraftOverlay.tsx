"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import {
  Role,
  Side,
  Pick,
} from "@/app/skillcheck/draft/draftCore";

import { DraftTeam } from "./DraftTeam";

/**
 * Play-only draft overlay: shows blue/red teams for solving the daily draft.
 * No authoring (drag-drop, slot selection, etc.). For authoring, use DraftAuthoringOverlay.
 */
export function DraftOverlay({
  blue,
  red,
  role,
  userTeam,
  solutionChamp,
  previewChamp,
  locked,
  onToggleLaneOrder,
  suppressHover,
}: {
  blue: Pick[];
  red: Pick[];
  role: Role;
  userTeam: Side;
  solutionChamp: string;
  previewChamp?: string | null;
  locked: boolean;
  onToggleLaneOrder?: () => void;
  suppressHover?: boolean;
}) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (
    !hydrated ||
    blue.length === 0 ||
    red.length === 0 ||
    (locked && !solutionChamp)
  ) {
    return null;
  }

  return (
    <div className="relative flex justify-center my-6 gap-10">
      {onToggleLaneOrder && (
        <button
          type="button"
          onClick={onToggleLaneOrder}
          className="pointer-events-auto absolute -bottom-14 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 rounded-lg border-2 border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-medium text-white shadow-[0_10px_15px_rgba(0,0,0,0.9),0_4px_6px_rgba(0,0,0,0.8)] hover:bg-gray-800 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.2} />
          <span>Switch order</span>
        </button>
      )}

      <DraftTeam
        team={blue}
        side="blue"
        role={role}
        userTeam={userTeam}
        previewChamp={previewChamp}
        solutionChamp={solutionChamp}
        locked={locked}
        suppressHover={suppressHover}
      />

      <DraftTeam
        team={red}
        side="red"
        role={role}
        userTeam={userTeam}
        previewChamp={previewChamp}
        solutionChamp={solutionChamp}
        locked={locked}
        suppressHover={suppressHover}
      />
    </div>
  );
}
