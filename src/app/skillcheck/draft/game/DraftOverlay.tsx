"use client";

import { useEffect, useState } from "react";

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

  disabledSlots?: DisabledSlots;
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
    <div className="flex justify-center my-6 gap-10">
      <Team
        team={blue}
        side="blue"
        role={role}
        userTeam={userTeam}
        previewChamp={previewChamp}
        solutionChamp={solutionChamp}
        locked={locked}
        authoring={authoring}
        activeSlot={activeSlot}
        onSlotClick={onSlotClick}
        onMoveRole={onMoveRole}
        disabledSlots={disabledSlots}
      />

      {authoring && (
        <div className="w-[720px] flex items-center justify-center">
          {center}
        </div>
      )}

      <Team
        team={red}
        side="red"
        role={role}
        userTeam={userTeam}
        previewChamp={previewChamp}
        solutionChamp={solutionChamp}
        locked={locked}
        authoring={authoring}
        activeSlot={activeSlot}
        onSlotClick={onSlotClick}
        onMoveRole={onMoveRole}
        disabledSlots={disabledSlots}
      />
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
}) {
  const userIndex = team.findIndex(
    (p) => side === userTeam && p.role === role
  );

  const userGlobalPick =
    side === userTeam && userIndex >= 0
      ? getGlobalPick(side, userIndex)
      : -1;

  return (
    <div className="flex flex-col gap-3">
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

        const slotState: SlotState =
          rawState === "disabled"
            ? "blocked"
            : rawState === "active"
            ? "solution"
            : rawState;

        const shouldPulse =
          !locked &&
          !authoring &&
          isUserSlot &&
          !p.champ;

        return (
          <div
            key={`${side}-${i}`}
            className={
              "flex items-center gap-3 " +
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
