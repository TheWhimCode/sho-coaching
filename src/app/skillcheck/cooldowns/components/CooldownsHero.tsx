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

export default function CooldownsHero({
  champion,
  spells,
  activeSpellId,
  askedKey,
  askedRank,
  askedMaxRank,
}: {
  champion: { id: string; name?: string; icon: string };
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
    <div className="w-full flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <img
          src={champion.icon}
          alt={champName}
          className="w-16 h-16 md:w-20 md:h-20 rounded-xl ring-1 ring-white/10"
        />
        <div className="flex flex-col">
          <div className="text-2xl md:text-3xl font-semibold leading-tight">
            {champName}
          </div>
          <div className="text-sm md:text-base opacity-80 leading-tight">
            Cooldowns — choose the correct scaling
          </div>
        </div>
      </div>

      <div className="w-full">
        <SpellPanelList
          spells={spellPanelSpells}
          selectedKey={selectedKey}
          title=""
          subtitle={undefined}
          // ✅ pips only on the asked spell icon
          askedKey={askedKey}
          askedRank={askedRank}
          askedMaxRank={askedMaxRank}
        />
      </div>
    </div>
  );
}
