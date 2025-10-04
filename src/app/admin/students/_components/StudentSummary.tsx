'use client';

import type { Student } from '@prisma/client';
import RankCard from './_components/StudentSummary/RankCard';
import RankGraph from './_components/StudentSummary/RankGraph';
import StudentDetails, {
  normalizeServer,
  type EditablePatch,
  type MinimalStudent,
} from './_components/StudentSummary/StudentDetails';

type Props = {
  student: MinimalStudent;
  onChange?: (updated: EditablePatch) => void;
};

export default function StudentSummary({ student, onChange }: Props) {
  return (
    <div className="flex w-full items-stretch">
      {/* Left: student info */}
      <StudentDetails student={student} onChange={onChange} />

      {/* Middle column: Rank graph */}
      <div className="mx-8 w-[420px] shrink-0 border-l border-white/10 pl-6">
      <div className="h-36 md:h-48">
        <RankGraph studentId={student.id} />
      </div>
      </div>

      {/* Right: compact column */}
      <div className="pl-6 border-l border-white/10 flex items-center justify-end shrink-0">
        {student.puuid ? (
          <RankCard
            puuid={student.puuid}
            server={normalizeServer(student.server)}
            widthClass="min-w-[200px]"
            heightClass="h-24"
            zoom={3.5}
          />
        ) : (
          <div className="text-sm text-zinc-400">No Riot account linked.</div>
        )}
      </div>
    </div>
  );
}
