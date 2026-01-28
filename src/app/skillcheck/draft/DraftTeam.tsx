// /draft/ui/DraftTeam.tsx

import { DraftSlot, SlotState } from "./game/DraftSlot";

export type TeamSlot = {
  champ?: string | null;
  state: SlotState;
  highlight?: boolean;
  onClick?: () => void;
};

export function DraftTeam({
  slots,
}: {
  slots: TeamSlot[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {slots.map((slot, i) => (
        <DraftSlot
          key={i}
          champ={slot.champ}
          state={slot.state}
          highlight={slot.highlight}
          onClick={slot.onClick}
        />
      ))}
    </div>
  );
}
