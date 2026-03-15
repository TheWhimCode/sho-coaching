"use client";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

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

export type ActiveSlot = {
  side: Side;
  index: number;
} | null;

export type DisabledSlots = Partial<Record<Side, boolean[]>>;

export function champUrlFromAny(input: string | null | undefined) {
  if (!input) return null;
  return champSquareUrlById(resolveChampionId(input));
}

export function getSlotState(
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

function SortableRow({
  id,
  side,
  justDropped,
  children,
}: {
  id: string;
  side: Side;
  justDropped?: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: justDropped ? undefined : CSS.Transform.toString(transform),
    transition: justDropped ? "none" : transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={
        "flex items-center gap-2 transition-transform duration-300 ease-out " +
        (side === "red" ? "flex-row-reverse" : "")
      }
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none p-1 -m-1 rounded text-white/40 hover:text-white/70 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      {children}
    </div>
  );
}

export type DraftTeamProps = {
  team: Pick[];
  side: Side;
  role: Role;
  userTeam: Side;
  previewChamp?: string | null;
  solutionChamp: string;
  locked: boolean;
  authoring?: boolean;
  sortable?: boolean;
  justDropped?: boolean;
  activeSlot?: ActiveSlot;
  onSlotClick?: (side: Side, index: number) => void;
  disabledSlots?: DisabledSlots;
  suppressHover?: boolean;
};

export function DraftTeam({
  team,
  side,
  role,
  userTeam,
  previewChamp,
  solutionChamp,
  locked,
  authoring = false,
  sortable = false,
  justDropped = false,
  activeSlot,
  onSlotClick,
  disabledSlots,
  suppressHover,
}: DraftTeamProps) {
  const userIndex = team.findIndex(
    (p) => side === userTeam && p.role === role
  );

  const userGlobalPick =
    side === userTeam && userIndex >= 0
      ? getGlobalPick(side, userIndex)
      : -1;

  const sortableIds = authoring && sortable ? team.map((_, i) => `${side}-${i}`) : [];

  const listContent = team.map((p, i) => {
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
      (authoring ? isActiveAuthorSlot && !p.champ : isUserSlot);

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

    const rowContent = (
      <>
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
      </>
    );

    if (sortable) {
      return (
        <SortableRow key={`${side}-${i}`} id={`${side}-${i}`} side={side} justDropped={justDropped}>
          {rowContent}
        </SortableRow>
      );
    }

    return (
      <div
        key={`${side}-${i}`}
        className={
          "flex items-center gap-3 transition-transform duration-300 ease-out " +
          (side === "red" ? "flex-row-reverse" : "")
        }
      >
        {rowContent}
      </div>
    );
  });

  const wrappedContent = sortable ? (
    <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
      {listContent}
    </SortableContext>
  ) : (
    listContent
  );

  return <div className="relative flex flex-col gap-3">{wrappedContent}</div>;
}
