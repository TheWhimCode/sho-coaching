// app/skillcheck/cooldowns/CooldownsClient.tsx
"use client";

import Hero from "@/app/skillcheck/layout/Hero";
import SuccessOverlay from "@/app/skillcheck/games/SuccessOverlay";
import { useEffect, useMemo, useRef, useState } from "react";
import CooldownsHero, {
  type CooldownsSpell,
} from "@/app/skillcheck/cooldowns/components/CooldownsHero";
import CooldownGuessOptions from "@/app/skillcheck/cooldowns/components/CooldownOptions";
import CooldownResult from "./components/CooldownsResult";

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
  askedRank?: number; // comes from server
}) {
  const [showSuccess, setShowSuccess] = useState(false);

  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Persistent scroll anchor in the DOM.
  const resultRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledRef = useRef(false);

  // Time before showing Result + initiating scroll (same moment)
  const SHOW_AND_SCROLL_DELAY_MS = 2500;
  const SCROLL_BEHAVIOR: ScrollBehavior = "smooth";

  /* -----------------------------
     determine active spell
  ----------------------------- */
  const activeSpell = useMemo(() => {
    if (initialActiveSpellId) {
      const found = spells.find((s) => s.id === initialActiveSpellId);
      if (found) return found;
    }
    return spells.find((s) => s.key === "R") ?? spells[0];
  }, [spells, initialActiveSpellId]);

  /* -----------------------------
     rank + true cooldown
  ----------------------------- */
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

  /* -----------------------------
     localStorage key
  ----------------------------- */
  const storageKey = useMemo(
    () => `skillcheck:cooldowns:${champion.id}:${activeSpell.id}:${rank}`,
    [champion.id, activeSpell.id, rank]
  );

  /* -----------------------------
     load localStorage state
  ----------------------------- */
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const s = JSON.parse(raw);
      setCompleted(!!s.completed);

      if (s.completed && !hasScrolledRef.current) {
        hasScrolledRef.current = true;

        setTimeout(() => {
          setShowResult(true);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resultRef.current?.scrollIntoView({
                behavior: SCROLL_BEHAVIOR,
                block: "center",
              });
            });
          });
        }, SHOW_AND_SCROLL_DELAY_MS);
      }
    } catch {}
  }, [storageKey]);

  function revealAndScrollToResult() {
    if (hasScrolledRef.current) return;
    hasScrolledRef.current = true;

    setTimeout(() => {
      setShowResult(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resultRef.current?.scrollIntoView({
            behavior: SCROLL_BEHAVIOR,
            block: "center",
          });
        });
      });
    }, SHOW_AND_SCROLL_DELAY_MS);
  }

  return (
    <>
      {showSuccess && <SuccessOverlay text="LOCKED IN!" />}

      <Hero
        hero={
          <CooldownsHero
            champion={champion}
            spells={spells as CooldownsSpell[]}
            activeSpellId={activeSpell.id}
            askedKey={activeSpell.key}
            askedRank={rank}
            askedMaxRank={maxRank}
          />
        }
        content={
          <>
            {/* IMPORTANT: always render, never conditional */}
            <CooldownGuessOptions
              question={question}
              trueCooldown={trueCooldown}
              onSolved={() => {
                if (completed) return;

                setCompleted(true);

                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 1500);

                localStorage.setItem(
                  storageKey,
                  JSON.stringify({ completed: true })
                );

                revealAndScrollToResult();
              }}
            />

            <div ref={resultRef}>
              {showResult && (
                <CooldownResult
                  champion={champion}
                  spell={activeSpell}
                  rank={rank}
                />
              )}
            </div>
          </>
        }
      />
    </>
  );
}
