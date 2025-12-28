// /draft/ui/DraftGrid.tsx

import { DraftTeam, TeamSlot } from "./DraftTeam";

export function DraftGrid({
  blue,
  red,
  center,
}: {
  blue: TeamSlot[];
  red: TeamSlot[];
  center?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center gap-10">
      <DraftTeam slots={blue} />
      {center}
      <DraftTeam slots={red} />
    </div>
  );
}
