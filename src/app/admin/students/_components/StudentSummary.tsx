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
    <div className="flex w-full flex-col md:flex-row items-stretch gap-6 md:gap-0">
      {/* Left: student info */}
      <StudentDetails student={student} onChange={onChange} />

      {/* Middle: Rank graph */}
      <div className="md:mx-8 md:w-[420px] md:shrink-0 md:border-l md:border-white/10 md:pl-6">
        <div className="h-36 md:h-48">
          <RankGraph studentId={student.id} />
        </div>
      </div>

      {/* Right: Rank card */}
<div className="
  flex
  items-center
  justify-center
  md:justify-end
  md:pl-6
  md:border-l
  md:border-white/10
">
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
