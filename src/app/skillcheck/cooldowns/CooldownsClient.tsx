"use client";

import Hero from "@/app/skillcheck/layout/Hero";
import SuccessOverlay from "@/app/skillcheck/games/SuccessOverlay";
import { useMemo, useState } from "react";
import CooldownsHero, {
  type CooldownsSpell,
} from "@/app/skillcheck/cooldowns/components/CooldownsHero";
import CooldownGuessOptions from "@/app/skillcheck/cooldowns/components/CooldownOptions";

type SpellKey = "Q" | "W" | "E" | "R";

type Spell = {
  id: string;
  name: string;
  cooldowns: number[];
  icon: string;
  key: SpellKey;
  tooltip?: string;
  description?: string;
};

export default function CooldownsClient({
  champion,
  spells,
  initialActiveSpellId,
  askedRank,
}: {
  champion: { id: string; name?: string; icon: string };
  spells: Spell[];
  initialActiveSpellId?: string;
  askedRank?: number; // ✅ comes from server
}) {
  const [showSuccess, setShowSuccess] = useState(false);

  // Determine which spell is being asked
  const activeSpell = useMemo(() => {
    if (initialActiveSpellId) {
      const found = spells.find((s) => s.id === initialActiveSpellId);
      if (found) return found;
    }
    return spells.find((s) => s.key === "R") ?? spells[0];
  }, [spells, initialActiveSpellId]);

  // Use server-provided rank (no randomness here!)
  const { rank, maxRank, trueCooldown } = useMemo(() => {
    const cooldowns = activeSpell.cooldowns ?? [];
    const maxRank = Math.max(1, cooldowns.length);

    const safeRank =
      typeof askedRank === "number"
        ? Math.min(Math.max(1, askedRank), maxRank)
        : 1;

    return {
      rank: safeRank,
      maxRank,
      trueCooldown: cooldowns[safeRank - 1] ?? 0,
    };
  }, [activeSpell, askedRank]);

  const question = `Guess the cooldown of ${activeSpell.name} at rank ${rank}?`;

  return (
    <>
      {showSuccess && <SuccessOverlay text="LOCKED IN!" />}

      <Hero
        hero={
          <CooldownsHero
            champion={champion}
            spells={spells as CooldownsSpell[]}
            activeSpellId={activeSpell.id}
            // ✅ pips info
            askedKey={activeSpell.key}
            askedRank={rank}
            askedMaxRank={maxRank}
          />
        }
        content={
          <CooldownGuessOptions
            question={question}
            trueCooldown={trueCooldown}
            onSolved={() => {
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 1500);
            }}
          />
        }
      />
    </>
  );
}
