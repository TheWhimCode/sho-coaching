"use client";

import {
  champSquareUrlById,
  resolveChampionId,
  ROLE_ICONS,
} from "@/lib/league/datadragon";

type Role = "top" | "jng" | "mid" | "adc" | "sup";
type Side = "blue" | "red";

type Pick = {
  role: Role;
  champ: string | null;
};

type ActiveSlot = {
  side: Side;
  index: number;
} | null;

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
}) {
  return (
    <div className="flex justify-center my-6 gap-10">
      <Team
        team={blue}
        side="blue"
        role={role}
        userTeam={userTeam}
        solutionChamp={solutionChamp}
        previewChamp={previewChamp}
        locked={locked}
        authoring={authoring}
        activeSlot={activeSlot}
        onSlotClick={onSlotClick}
        onMoveRole={onMoveRole}
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
        solutionChamp={solutionChamp}
        previewChamp={previewChamp}
        locked={locked}
        authoring={authoring}
        activeSlot={activeSlot}
        onSlotClick={onSlotClick}
        onMoveRole={onMoveRole}
      />
    </div>
  );
}

function Team({
  team,
  side,
  role,
  userTeam,
  solutionChamp,
  previewChamp,
  locked,
  authoring,
  activeSlot,
  onSlotClick,
  onMoveRole,
}: {
  team: Pick[];
  side: Side;
  role: Role;
  userTeam: Side;
  solutionChamp: string;
  previewChamp?: string | null;
  locked: boolean;

  authoring?: boolean;
  activeSlot?: ActiveSlot;
  onSlotClick?: (side: Side, index: number) => void;

  onMoveRole?: (side: Side, index: number, dir: -1 | 1) => void;
}) {
  const userIndex = authoring
    ? -1
    : team.findIndex(
        (p) => side === userTeam && p.role === role
      );

  return (
    <div className="flex flex-col gap-3">
      {team.map((p, i) => {
        const isUserSlot =
          !authoring && side === userTeam && p.role === role;

        const isSolutionSlot =
          authoring &&
          side === userTeam &&
          p.role === role;

        const isActiveAuthorSlot =
          authoring &&
          activeSlot?.side === side &&
          activeSlot?.index === i;

        const isPreviewing = !!(
          previewChamp &&
          (authoring ? isActiveAuthorSlot : isUserSlot)
        );

        const champToShow = isSolutionSlot
          ? solutionChamp
          : isPreviewing
          ? previewChamp
          : p.champ;

        const state = authoring
          ? p.champ || isSolutionSlot
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

        const goldBorder =
          "border-yellow-400 " +
          (!locked ? "animate-pulse " : "");

        return (
          <div
            key={`${side}-${i}`}
            className={
              "flex items-center gap-3 " +
              (side === "red"
                ? "flex-row-reverse"
                : "")
            }
          >
            {/* REORDER ARROWS (ALWAYS ALLOWED IN AUTHORING) */}
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

            {/* ROLE ICON */}
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

            {/* PICK */}
            <div
              className="rounded-lg"
              style={{
                boxShadow:
                  "0 10px 15px rgba(0,0,0,0.9), 0 4px 6px rgba(0,0,0,0.8)",
              }}
            >
              <div
                onClick={() => {
                  if (
                    authoring &&
                    onSlotClick &&
                    !locked &&
                    !isSolutionSlot
                  ) {
                    onSlotClick(side, i);
                  }
                }}
                className={[
                  "w-16 h-16 rounded-lg overflow-hidden bg-gray-900 border-2",
                  isSolutionSlot
                    ? side === "blue"
                      ? "border-blue-500 cursor-default"
                      : "border-red-500 cursor-default"
                    : authoring && isActiveAuthorSlot
                    ? "border-yellow-300 cursor-pointer"
                    : isUserSlot
                    ? goldBorder
                    : slotStyles(state, side),
                ].join(" ")}
              >
                <div className="relative w-full h-full">
                  {champToShow ? (
                    <img
                      src={champSquareUrlById(
                        resolveChampionId(champToShow)
                      )}
                      alt={champToShow}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 opacity-40" />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* helpers */

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

  if (
    side === userTeam &&
    index > userIndex &&
    pick.champ
  ) {
    return "hover";
  }

  if (pick.champ) return "filled";
  return "empty";
}

function slotStyles(
  state: "filled" | "active" | "hover" | "empty",
  side: Side
) {
  switch (state) {
    case "filled":
      return side === "blue"
        ? "border-blue-500"
        : "border-red-500";
    case "active":
    case "hover":
      return "border-gray-500";
    default:
      return "border-gray-700 opacity-90";
  }
}
