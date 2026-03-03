// /draft/ui/DraftTeam.tsx

import { DraftSlot, SlotState } from "./game/DraftSlot";
import { ROLE_ICONS } from "@/lib/datadragon";
import type { Role, Side } from "./draftCore";

export type TeamSlot = {
  champ?: string | null;
  state: SlotState;
  highlight?: boolean;
  onClick?: () => void;
  role?: Role;
  side?: Side;
};

export function DraftTeam({
  slots,
}: {
  slots: TeamSlot[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {slots.map((slot, i) => (
        <div
          key={i}
          className={
            "flex items-center gap-3 " +
            (slot.side === "red" ? "flex-row-reverse" : "")
          }
        >
          {slot.role && (
            <div
              className="w-6 h-6 rounded"
              style={{
                boxShadow:
                  "0 4px 6px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.8)",
              }}
            >
              <img
                src={ROLE_ICONS[slot.role]}
                className="w-6 h-6 opacity-80"
                alt={slot.role}
              />
            </div>
          )}

          <DraftSlot
            champ={slot.champ}
            state={slot.state}
            highlight={slot.highlight}
            onClick={slot.onClick}
            side={slot.side}
          />
        </div>
      ))}
    </div>
  );
}
