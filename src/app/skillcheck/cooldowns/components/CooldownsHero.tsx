"use client";

import { useMemo } from "react";
import SpellPanelList, {
  type SpellKey,
  type SpellPanelSpell,
} from "./SpellPanelList";

export type CooldownsSpell = {
  id: string;
  name: string;
  cooldowns: number[];
  icon: string;
  key: SpellKey;
  tooltip?: string;
  description?: string;
};

export type ChampionHero = {
  id: string;
  name?: string;
  title?: string;
  icon: string;
};

export default function CooldownsHero({
  champion,
  spells,
  activeSpellId,
  askedKey,
  askedRank,
  askedMaxRank,
}: {
  champion: ChampionHero;
  spells: CooldownsSpell[];
  activeSpellId: string;
  askedKey?: SpellKey;
  askedRank?: number;
  askedMaxRank?: number;
}) {
  const champName = champion.name ?? champion.id;

  const selectedKey = useMemo<SpellKey>(() => {
    const active = spells.find((s) => s.id === activeSpellId);
    return (active?.key ?? "R") as SpellKey;
  }, [spells, activeSpellId]);

  const spellPanelSpells = useMemo<SpellPanelSpell[]>(
    () =>
      spells.map((s) => ({
        id: s.id,
        key: s.key,
        name: s.name,
        tooltip: s.tooltip,
        description: s.description,
        icon: s.icon,
      })),
    [spells]
  );

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Champion identity */}
      <div className="flex items-center gap-5">
        {/* Framed icon */}
        <div className="relative">
          <div className="absolute -inset-1 rounded-2xl bg-white/10 blur-sm" />
          <div className="relative rounded-2xl border border-white/15 bg-white/5 p-1 shadow-lg">
            <img
              src={champion.icon}
              alt={champName}
              className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover"
            />
          </div>
        </div>

        {/* Name + title */}
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
            {champName}
          </h1>

          {champion.title && (
            <div className="text-md md:text-xl text-white/70 tracking-wide">
              {champion.title}
            </div>
          )}
        </div>
      </div>

      {/* Spells */}
      <div className="w-full">
        <SpellPanelList
          spells={spellPanelSpells}
          selectedKey={selectedKey}
          title=""
          subtitle={undefined}
          askedKey={askedKey}
          askedRank={askedRank}
          askedMaxRank={askedMaxRank}
        />
      </div>
    </div>
  );
}
