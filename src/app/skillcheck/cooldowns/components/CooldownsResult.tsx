// app/skillcheck/cooldowns/components/CooldownsResult.tsx
"use client";

import { useMemo } from "react";
import ResultsScreen from "@/app/skillcheck/components/ResultScreen";
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

export default function CooldownsResult({
  champion,
  spell,
  rank,
}: {
  champion: { id: string; name?: string; icon: string };
  spell: Spell;
  rank: number; // 1-based
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

  const avgAttempts = "—";

  return (
    <ResultsScreen
      avgAttempts={avgAttempts}
      header={
        <div className="relative py-6 md:py-8">
          {/* ability icon with circular fade */}
          <img
            src={spell.icon}
            alt=""
            aria-hidden
            className="
              absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-24 h-24 md:w-32 md:h-32
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

          {/* header row */}
          <div className="relative flex justify-center">
            <div className="text-center text-3xl md:text-4xl font-semibold leading-tight">
              <span className="opacity-90">{champName}</span>
              <span className="mx-2 opacity-60">—</span>
              <span className="font-black">{spell.key}</span>{" "}
              <span className="opacity-95">{spell.name}</span>
            </div>
          </div>
        </div>
      }
    >
      {/* single centered cooldown line */}
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
    </ResultsScreen>
  );
}
