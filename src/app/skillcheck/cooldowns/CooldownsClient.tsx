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
}: {
  champion: { id: string; name?: string; icon: string };
  spells: Spell[];
  initialActiveSpellId?: string;
}) {
  const [showSuccess, setShowSuccess] = useState(false);

  const activeSpell = useMemo(() => {
    // 1️⃣ prefer server-chosen spell
    if (initialActiveSpellId) {
      const found = spells.find((s) => s.id === initialActiveSpellId);
      if (found) return found;
    }

    // 2️⃣ fallback: any R
    const r = spells.find((s) => s.key === "R");
    if (r) return r;

    // 3️⃣ absolute fallback
    return spells[0];
  }, [spells, initialActiveSpellId]);

  // Rank 1 only
  const trueCooldownRank1 = activeSpell.cooldowns?.[0] ?? 0;

  const question = `Guess the cooldown of ${activeSpell.name} at rank 1?`;

  return (
    <>
      {showSuccess && <SuccessOverlay text="LOCKED IN!" />}

      <Hero
        hero={
          <CooldownsHero
            champion={champion}
            spells={spells as CooldownsSpell[]}
            activeSpellId={activeSpell.id}
          />
        }
        content={
          <CooldownGuessOptions
            question={question}
            trueCooldown={trueCooldownRank1}
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
