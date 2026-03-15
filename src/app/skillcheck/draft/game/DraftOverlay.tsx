"use client";

import { useEffect, useState } from "react";
import GlassPanel from "@/app/_components/panels/GlassPanel";
import { RefreshCw } from "lucide-react";

import {
  champSquareUrlById,
  resolveChampionId,
  ROLE_ICONS,
} from "@/lib/datadragon";

import {
  getGlobalPick,
  Role,
  Side,
  Pick,
} from "@/app/skillcheck/draft/draftCore";

import { DraftSlot, SlotState } from "./DraftSlot";

type ActiveSlot = {
  side: Side;
  index: number;
} | null;

type DisabledSlots = Partial<Record<Side, boolean[]>>;

const AUTHOR_TUTORIAL_KEY = "skillcheck:draftAuthorTutorialSeen";

export function DraftOverlay({
  blue,
  red,
  role,
  userTeam,
  solutionChamp,
  previewChamp,
  locked,
  authoring = false,
  activeSlot,
  onSlotClick,
  center,
  onMoveRole,
  onToggleLaneOrder,
  suppressHover,
  disabledSlots,
}: {
  blue: Pick[];
  red: Pick[];
  role: Role;
  userTeam: Side;
  solutionChamp: string;

  previewChamp?: string | null;
  locked: boolean;
  authoring?: boolean;

  activeSlot?: ActiveSlot;
  onSlotClick?: (side: Side, index: number) => void;

  center?: React.ReactNode;

  onMoveRole?: (side: Side, index: number, dir: -1 | 1) => void;

  onToggleLaneOrder?: () => void;
  suppressHover?: boolean;
  disabledSlots?: DisabledSlots;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<1 | 2 | 3 | null>(1);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Only show the authoring tutorial the first time on this device.
  useEffect(() => {
    if (!authoring) return;
    try {
      const seen = localStorage.getItem(AUTHOR_TUTORIAL_KEY);
      if (seen === "1") {
        setTutorialStep(null);
      }
    } catch {
      // ignore storage errors
    }
  }, [authoring]);

  if (
    !hydrated ||
    blue.length === 0 ||
    red.length === 0 ||
    (locked && !solutionChamp)
  ) {
    return null;
  }

  // Normal player-facing draft UI: keep original wider spacing.
  if (!authoring) {
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

        <Team
          team={blue}
          side="blue"
          role={role}
          userTeam={userTeam}
          previewChamp={previewChamp}
          solutionChamp={solutionChamp}
          locked={locked}
          suppressHover={suppressHover}
        />

        <Team
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

  const showTutorial = tutorialStep !== null;

  return (
    <div className="relative flex w-full max-w-6xl items-stretch justify-between my-6 px-4 py-6">
      <div className="flex-1 flex justify-start">
        <Team
          team={blue}
          side="blue"
          role={role}
          userTeam={userTeam}
          previewChamp={previewChamp}
          solutionChamp={solutionChamp}
          locked={locked}
          authoring
          activeSlot={activeSlot}
          onSlotClick={onSlotClick}
          onMoveRole={onMoveRole}
          disabledSlots={disabledSlots}
          suppressHover={suppressHover}
        />
      </div>

      <div className="w-[720px] flex items-center justify-center">
        {center}
      </div>

      <div className="flex-1 flex justify-end">
        <Team
          team={red}
          side="red"
          role={role}
          userTeam={userTeam}
          previewChamp={previewChamp}
          solutionChamp={solutionChamp}
          locked={locked}
          authoring
          activeSlot={activeSlot}
          onSlotClick={onSlotClick}
          onMoveRole={onMoveRole}
          disabledSlots={disabledSlots}
          suppressHover={suppressHover}
        />
      </div>

      {showTutorial && (
        <div className="pointer-events-auto absolute -bottom-12 right-8">
          <GlassPanel className="max-w-sm px-4 py-3 text-base text-white/80 shadow-lg backdrop-blur-[6px]">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                {tutorialStep === 1 &&
                  "Pick the comps for both teams that will enable your champ to the max."}
                {tutorialStep === 2 &&
                  "Use the arrows to change the pick-order and match a real champselect."}
                {tutorialStep === 3 &&
                  "Enemies that pick after you are locked. Adjust pick-order to unlock them."}
              </div>
              <button
                type="button"
                className="cursor-pointer text-base text-sky-300 hover:text-sky-200"
                onClick={() => {
                  if (tutorialStep === 3) {
                    setTutorialStep(null);
                    try {
                      localStorage.setItem(AUTHOR_TUTORIAL_KEY, "1");
                    } catch {
                      // ignore
                    }
                  } else {
                    setTutorialStep((tutorialStep === 1 ? 2 : 3) as 1 | 2 | 3);
                  }
                }}
              >
                {tutorialStep === 1 ? "Next 1/3" : tutorialStep === 2 ? "Next 2/3" : "Finish 3/3"}
              </button>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
}

function champUrlFromAny(input: string | null | undefined) {
  if (!input) return null;
  return champSquareUrlById(resolveChampionId(input));
}

function Team({
  team,
  side,
  role,
  userTeam,
  previewChamp,
  solutionChamp,
  locked,
  authoring,
  activeSlot,
  onSlotClick,
  onMoveRole,
  disabledSlots,
  suppressHover,
}: {
  team: Pick[];
  side: Side;
  role: Role;
  userTeam: Side;
  previewChamp?: string | null;
  solutionChamp: string;
  locked: boolean;

  authoring?: boolean;
  activeSlot?: ActiveSlot;
  onSlotClick?: (side: Side, index: number) => void;

  onMoveRole?: (side: Side, index: number, dir: -1 | 1) => void;

  disabledSlots?: DisabledSlots;
  suppressHover?: boolean;
}) {
  const userIndex = team.findIndex(
    (p) => side === userTeam && p.role === role
  );

  const userGlobalPick =
    side === userTeam && userIndex >= 0
      ? getGlobalPick(side, userIndex)
      : -1;

  return (
    <div className="relative flex flex-col gap-3">
      {team.map((p, i) => {
        const isUserSlot =
          !authoring && side === userTeam && p.role === role;

        const isActiveAuthorSlot =
          authoring &&
          activeSlot?.side === side &&
          activeSlot?.index === i;

        const isDisabled =
          !!authoring && !!disabledSlots?.[side]?.[i];

        const isOwnFutureSlot =
          authoring &&
          side === userTeam &&
          userGlobalPick >= 0 &&
          getGlobalPick(side, i) > userGlobalPick;

        const isPreviewing =
          !!previewChamp &&
          (authoring ? isActiveAuthorSlot : isUserSlot);

        const champToShow = isPreviewing
          ? previewChamp
          : !authoring &&
            locked &&
            isUserSlot &&
            !p.champ
          ? solutionChamp
          : p.champ;

        const rawState = authoring
          ? isDisabled
            ? "disabled"
            : isOwnFutureSlot && p.champ
            ? "hover"
            : p.champ
            ? "filled"
            : "empty"
          : getSlotState(
              p,
              side,
              role,
              userTeam,
              isPreviewing,
              i,
              userIndex
            );
        const effectiveState =
          !authoring && suppressHover && rawState === "hover"
            ? "filled"
            : rawState;

        const slotState: SlotState =
          effectiveState === "disabled"
            ? "blocked"
            : effectiveState === "active"
            ? "solution"
            : effectiveState;

        const shouldPulse =
          !locked &&
          !authoring &&
          isUserSlot &&
          !p.champ;

        return (
          <div
            key={`${side}-${i}`}
            className={
              "flex items-center gap-3 transition-transform duration-300 ease-out " +
              (side === "red" ? "flex-row-reverse" : "")
            }
          >
            {authoring && onMoveRole && (
              <div className="flex flex-col items-center gap-[2px]">
                <button
                  disabled={i === 0}
                  onClick={() => onMoveRole(side, i, -1)}
                  className="
                    w-4 h-4 text-[10px] rounded
                    bg-black/70 text-white
                    hover:bg-black/90
                    disabled:opacity-20
                  "
                >
                  ▲
                </button>
                <button
                  disabled={i === team.length - 1}
                  onClick={() => onMoveRole(side, i, 1)}
                  className="
                    w-4 h-4 text-[10px] rounded
                    bg-black/70 text-white
                    hover:bg-black/90
                    disabled:opacity-20
                  "
                >
                  ▼
                </button>
              </div>
            )}

            <div
              className="w-6 h-6 rounded"
              style={{
                boxShadow:
                  "0 4px 6px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)",
              }}
            >
              <img
                src={ROLE_ICONS[p.role]}
                className="w-6 h-6 opacity-80"
                alt={p.role}
              />
            </div>

            <DraftSlot
              champ={champUrlFromAny(champToShow)}
              state={slotState}
              side={side}
              highlight={
                isUserSlot ||
                (authoring && isActiveAuthorSlot)
              }
              pulse={shouldPulse}
              onClick={() => {
                if (
                  authoring &&
                  onSlotClick &&
                  !locked &&
                  !isDisabled
                ) {
                  onSlotClick(side, i);
                }
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function getSlotState(
  pick: Pick,
  side: Side,
  role: Role,
  userTeam: Side,
  previewMode = false,
  index: number,
  userIndex: number
): "filled" | "active" | "hover" | "empty" {
  const isUserSlot = side === userTeam && pick.role === role;

  if (isUserSlot && previewMode) return "hover";
  if (isUserSlot) return "active";

  if (side === userTeam && index > userIndex && pick.champ) {
    return "hover";
  }

  if (pick.champ) return "filled";
  return "empty";
}
