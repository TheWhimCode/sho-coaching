// app/skillcheck/cooldowns/CooldownsClient.tsx
"use client";

import Hero from "@/app/skillcheck/layout/Hero";
import SuccessOverlay from "@/app/skillcheck/components/SuccessOverlay";
import { useEffect, useMemo, useRef, useState } from "react";
import CooldownsHero, {
  type CooldownsSpell,
} from "@/app/skillcheck/cooldowns/components/CooldownsHero";
import CooldownOptions from "@/app/skillcheck/cooldowns/components/CooldownOptions";
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
  dayKey,
  champion,
  spells,
  initialActiveSpellId,
  askedRank,
  avgAttempts,
}: {
  dayKey: string;
  champion: { id: string; name?: string; title?: string; icon: string };
  spells: Spell[];
  initialActiveSpellId?: string;
  askedRank?: number;
  avgAttempts: string;
}) {
  const [showSuccess, setShowSuccess] = useState(false);

  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);

  const resultRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledRef = useRef(false);

  const SHOW_AND_SCROLL_DELAY_MS = 2500;
  const SCROLL_BEHAVIOR: ScrollBehavior = "smooth";

  const activeSpell = useMemo(() => {
    if (initialActiveSpellId) {
      const found = spells.find((s) => s.id === initialActiveSpellId);
      if (found) return found;
    }
    return spells.find((s) => s.key === "R") ?? spells[0];
  }, [spells, initialActiveSpellId]);

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

  const storageKey = useMemo(
    () =>
      `skillcheck:cooldowns:${dayKey}:${champion.id}:${activeSpell.id}:${rank}`,
    [dayKey, champion.id, activeSpell.id, rank]
  );

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;

    try {
      const s = JSON.parse(raw);
      const isCompleted = !!s.completed;

      setCompleted(isCompleted);

      // ✅ NEW: replay success animation on every page load if already solved
      if (isCompleted) {
        setShowSuccess(true);
      }

      if (isCompleted && !hasScrolledRef.current) {
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
      {showSuccess && (
        <SuccessOverlay
          durationMs={1900}
          text={`${trueCooldown}s`}
          onDone={() => setShowSuccess(false)}
        />
      )}

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
            <CooldownOptions
              question={question}
              trueCooldown={trueCooldown}
              championId={champion.id}
              spellKey={activeSpell.key}
              rank={rank}
              storageKey={storageKey}
              onSolved={() => {
                if (completed) return;

                setCompleted(true);

                setShowSuccess(true);
                // ❌ removed: setTimeout(() => setShowSuccess(false), 1500);

                try {
                  const raw = localStorage.getItem(storageKey);
                  const s = raw ? JSON.parse(raw) : {};
                  localStorage.setItem(
                    storageKey,
                    JSON.stringify({ ...s, completed: true })
                  );
                } catch {
                  localStorage.setItem(
                    storageKey,
                    JSON.stringify({ completed: true })
                  );
                }

                revealAndScrollToResult();
              }}
            />

            <div ref={resultRef}>
              {showResult && (
                <CooldownResult
                  champion={champion}
                  spell={activeSpell}
                  rank={rank}
                  avgAttempts={avgAttempts}
                  storageKey={storageKey}
                />
              )}
            </div>
          </>
        }
      />
    </>
  );
}
