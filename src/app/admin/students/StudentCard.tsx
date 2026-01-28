"use client";

import Link from "next/link";
import useSWR from "swr";
import Image from "next/image";
import { championAvatarByName } from "@/lib/league/datadragon";

type Student = {
  id: string;
  name: string;
  discordName: string | null;
  riotTag: string | null;
  allChampions: string[];
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

// ------------------------------------------
// LP badge
// ------------------------------------------

function LPBadge({
  studentId,
  overrideDelta,
}: {
  studentId: string;
  overrideDelta?: number;
}) {
  if (typeof overrideDelta === "number") {
    const delta = overrideDelta;
    const color =
      delta > 0
        ? "text-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
        : delta < 0
        ? "text-red-500 bg-red-500/10 ring-1 ring-red-500/30"
        : "text-zinc-400 bg-zinc-700/20 ring-1 ring-zinc-600/30";

    return (
      <span
        className={`ml-auto shrink-0 text-xs px-2 py-0.5 rounded-md font-medium tabular-nums ${color}`}
        title="LP gained in the last 7 days"
      >
        {delta > 0 ? `+${delta}` : delta} LP
      </span>
    );
  }

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
    : delta! > 0
    ? "text-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30"
    : delta! < 0
    ? "text-red-500 bg-red-500/10 ring-1 ring-red-500/30"
    : "text-zinc-400 bg-zinc-700/20 ring-1 ring-zinc-600/30";

  const formatted = !hasData ? "—" : delta! > 0 ? `+${delta}` : `${delta}`;

  return (
    <span
      className={`ml-auto shrink-0 text-xs px-2 py-0.5 rounded-md font-medium tabular-nums ${badgeColor}`}
      title="Rank points gained since first session"
    >
      {formatted} LP
    </span>
  );
}

// ------------------------------------------
// Champion icons (right-aligned)
// ------------------------------------------

function ChampionsIcons({ champions }: { champions: string[] | null }) {
  const list = Array.isArray(champions) ? champions : [];
  if (list.length === 0) return null;

  const max = 6;
  const shown = list.slice(0, max);
  const remaining = list.length - shown.length;

  return (
    <div className="ml-auto flex items-center gap-1 shrink-0">
      {shown.map((champ) => {
        const src = championAvatarByName(champ);
        return (
          <div
            key={champ}
            className="h-6 w-6 rounded-full overflow-hidden ring-1 ring-white/20 bg-zinc-900"
            title={champ}
          >
            <Image
              src={src}
              alt={champ}
              width={24}
              height={24}
              className="h-full w-full object-cover scale-[1.12]"
              unoptimized
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "/images/coaching/reviews/placeholder-avatar.png";
              }}
            />
          </div>
        );
      })}

      {remaining > 0 && (
        <span
          className="ml-1 text-[11px] px-2 py-0.5 rounded-md font-medium tabular-nums text-zinc-300 bg-zinc-700/20 ring-1 ring-zinc-600/30"
          title={`${remaining} more champions`}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}

// ------------------------------------------
// Main Component
// ------------------------------------------

export default function StudentCard({
  student,
  lpDelta,
}: {
  student: Student;
  lpDelta?: number;
}) {
  return (
    <Link
      href={`/admin/students/${student.id}`}
      className="block h-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 hover:border-zinc-700 transition"
    >
      <div className="flex h-full flex-col gap-2">
        {/* Top row */}
        <div className="flex items-start gap-2">
          <div className="min-w-0 text-lg font-semibold tracking-tight break-words">
            {student.name}
          </div>
          <LPBadge studentId={student.id} overrideDelta={lpDelta} />
        </div>

        {/* Info + champs row */}
        <div className="flex items-start gap-2 text-xs text-zinc-300">
          <div className="flex flex-col gap-0">
            <div>
              Discord:{" "}
              <span className="text-zinc-100">
                {student.discordName || "—"}
              </span>
            </div>
            <div>
              Riot:{" "}
              <span className="text-zinc-100">{student.riotTag || "—"}</span>
            </div>
          </div>

          {/* right-hand side */}
          <ChampionsIcons champions={student.allChampions} />
        </div>
      </div>
    </Link>
  );
}
