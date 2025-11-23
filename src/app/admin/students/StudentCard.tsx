// components/StudentCard.tsx
"use client";

import Link from "next/link";
import useSWR from "swr";

type Student = {
  id: string;
  name: string;
  discordName: string | null;
  riotTag: string | null;
  server: string | null;
  updatedAt: string;
};

type ClimbSummaryResp = {
  overall: {
    deltaToLatest: number;
    latestRank: {
      tier: string;
      division: string | null;
      lp: number;
    };
    fromSessionStart: string;
    baselineDateTime: string;
    latestDateTime: string;
  } | null;
};

const climbSummaryFetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<ClimbSummaryResp>);

function LPBadge({ studentId }: { studentId: string }) {
  const { data } = useSWR<ClimbSummaryResp>(
    `/api/admin/students/climb-summary?studentId=${encodeURIComponent(
      studentId
    )}`,
    climbSummaryFetcher
  );

  const delta = data?.overall?.deltaToLatest;
  const hasData = typeof delta === "number";

  const badgeColor = !hasData
    ? "text-zinc-400 bg-zinc-700/20 ring-1 ring-zinc-600/30"
    : delta > 0
    ? "text-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
    : delta < 0
    ? "text-red-500 bg-red-500/10 ring-1 ring-red-500/30"
    : "text-zinc-400 bg-zinc-700/20 ring-1 ring-zinc-600/30";

  const formatted = !hasData ? "—" : delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <span
      className={`ml-auto shrink-0 text-xs px-2 py-0.5 rounded-md font-medium tabular-nums ${badgeColor}`}
      title="Rank points gained since first session"
    >
      {formatted} LP
    </span>
  );
}

export default function StudentCard({ student }: { student: Student }) {
  return (
    <Link
      href={`/admin/students/${student.id}`}
      className="block rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 hover:border-zinc-700 transition"
    >
      <div className="flex items-center gap-2">
        <div className="text-lg font-semibold tracking-tight">
          {student.name}
        </div>
        <LPBadge studentId={student.id} />
      </div>

      <div className="mt-1 text-xs text-zinc-300 flex flex-wrap gap-x-3 gap-y-1">
        <span>
          Discord:{" "}
          <span className="text-zinc-100">
            {student.discordName || "—"}
          </span>
        </span>
        <span>
          Riot:{" "}
          <span className="text-zinc-100">
            {student.riotTag || "—"}
          </span>
        </span>
        <span>
          Server:{" "}
          <span className="text-zinc-100 uppercase">
            {student.server || "—"}
          </span>
        </span>
      </div>

      <div className="mt-2 text-[11px] text-zinc-400">
        Updated {new Date(student.updatedAt).toLocaleString()}
      </div>
    </Link>
  );
}
