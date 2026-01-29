// app/skillcheck/cooldowns/components/CooldownsResult.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import ResultsScreen, {
  DifficultyUI,
} from "@/app/skillcheck/components/ResultScreen";
import type { SpellKey } from "./SpellPanelList";

type Spell = {
  id: string;
  name: string;
  cooldowns: number[];
  icon: string;
  key: SpellKey;
  tooltip?: string;
  description?: string;
};

type Direction = "low" | "high" | "correct";

type Attempt = {
  guess: number;
  direction: Direction;
  rel: number;
};

function getCooldownsDifficulty(avgAttempts: string): DifficultyUI {
  const avg = Number(avgAttempts);

  if (!Number.isFinite(avg)) {
    return { label: "—", color: "border-white/20 text-white/60" };
  }

  return avg <= 3.0
    ? { label: "Easy", color: "border-green-400/40 text-green-400" }
    : avg <= 5.0
    ? { label: "Tricky", color: "border-blue-500/40 text-blue-500" }
    : avg <= 7.0
    ? { label: "Hard", color: "border-orange-400/40 text-orange-400" }
    : { label: "Nightmare", color: "border-red-700/50 text-red-700" };
}

export default function CooldownsResult({
  champion,
  spell,
  rank,
  avgAttempts,
  storageKey,
}: {
  champion: { id: string; name?: string; icon: string };
  spell: Spell;
  rank: number;
  avgAttempts: string;
  storageKey: string;
}) {
  const champName = champion.name ?? champion.id;

  const safeMaxRank = Math.max(1, spell.cooldowns?.length ?? 1);
  const safeRank = Math.min(Math.max(1, rank), safeMaxRank);

  const cooldownText = useMemo(() => {
    const arr = spell.cooldowns ?? [];
    if (!arr.length) return "—";

    return arr
      .map((cd, i) => {
        const r = i + 1;
        if (r !== safeRank) return String(cd);

        return `<span class="bg-gradient-to-r from-blue-400 to-orange-400 bg-clip-text text-transparent font-black drop-shadow-[0_0_18px_rgba(96,165,250,0.65)]">${cd}</span>`;
      })
      .join(" / ");
  }, [spell.cooldowns, safeRank]);

  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;

      const s = JSON.parse(raw);
      const arr = Array.isArray(s?.attempts) ? (s.attempts as Attempt[]) : [];
      setAttempts(arr);
    } catch {}
  }, [storageKey]);

  function fmtGuess(n: number) {
    return Number.isInteger(n) ? `${n}` : n.toFixed(1);
  }

  function arrow(direction: Direction) {
    return direction === "low" ? "⬆️" : direction === "high" ? "⬇️" : "✅";
  }

  const difficulty = useMemo(
    () => getCooldownsDifficulty(avgAttempts),
    [avgAttempts]
  );

  return (
    <ResultsScreen
      avgAttempts={avgAttempts}
      difficulty={difficulty}
      header={
        <div className="relative py-6 md:py-8">
          <img
            src={spell.icon}
            alt=""
            aria-hidden
            className="
              absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-24 h-24 md:w-32 md:h-32
              saturate-150
              object-cover
              pointer-events-none
              select-none
            "
            style={{
              WebkitMaskImage:
                "radial-gradient(circle at center, black 60%, transparent 95%)",
              maskImage:
                "radial-gradient(circle at center, black 60%, transparent 95%)",
            }}
          />

          <div className="relative flex justify-center">
            <div className="text-center text-3xl md:text-4xl font-semibold leading-tight">
              <span className="opacity-90">{champName}</span>{" "}
              <span className="font-black">{spell.key}</span>
              <span className="mx-2">—</span>
              <span className="opacity-95">{spell.name}</span>
            </div>
          </div>
        </div>
      }
    >
      <div className="mt-8 flex justify-center">
        <div
          className="
            text-2xl sm:text-3xl md:text-4xl
            font-black
            text-white/30
            leading-tight
            text-center
          "
          dangerouslySetInnerHTML={{ __html: cooldownText }}
        />
      </div>

      {attempts.length > 0 && (
        <div className="mt-12">

          <div className="px-4 md:px">
            <div className="flex items-baseline justify-between">
              <div className="text-lg uppercase tracking-wide text-gray-400 mb-2">
                Your attempts
              </div>
              <div className="text-xs md:text-sm text-white/45">
                {attempts.length} total
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-3">
              {attempts.map((a, i) => {
                const ok = a.direction === "correct";
                return (
                  <div
                    key={i}
                    className={[
                      "flex items-center gap-3",
                      "rounded-xl px-4 py-3",
                      "border border-white/5",
                      "text-base md:text-lg font-semibold",
                      ok ? "text-emerald-200" : "text-white/90",
                    ].join(" ")}
                  >
                    <span className="text-white/65 font-black tabular-nums">
                      #{i + 1}
                    </span>

                    <span className="font-black tabular-nums">
                      {fmtGuess(a.guess)}s
                    </span>

                    {/* plain emoji, no box */}
                    <span className="text-lg">
                      {arrow(a.direction)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </ResultsScreen>
  );
}
