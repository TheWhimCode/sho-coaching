// app/skillcheck/cooldowns/components/CooldownOptions.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";

const HEAVY_TEXT_SHADOW =
  "0 0 10px rgba(0,0,0,0.95), 0 0 22px rgba(0,0,0,0.95), 0 0 36px rgba(0,0,0,0.95)";

type Direction = "low" | "high" | "correct";

type Attempt = {
  guess: number;
  direction: Direction;
  rel: number; // |guess - true| / true
};

type Tier =
  | "perfect"
  | "almost"
  | "slight"
  | "close"
  | "getting"
  | "way"
  | "noclue";

/* ---------- parsing ---------- */

function parseSeconds(input: string): number | null {
  // allow decimals: 14.5 / 14,5
  const m = input.trim().match(/-?\d+(?:[.,]\d+)?/);
  if (!m) return null;

  const normalized = m[0].replace(",", ".");
  const n = Number(normalized);

  if (!Number.isFinite(n)) return null;

  // LoL cooldowns use at most 1 decimal → clamp safely
  return Math.round(n * 10) / 10;
}

function toRgba(rgb: [number, number, number], a: number) {
  const [r, g, b] = rgb;
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}

/* ---------- Tier system ---------- */

function tierFromRel(rel: number): Tier {
  if (rel === 0) return "perfect";
  if (rel > 0.4) return "noclue";
  if (rel <= 0.05) return "almost";
  if (rel <= 0.1) return "slight";
  if (rel <= 0.15) return "close";
  if (rel <= 0.3) return "getting";
  return "way";
}

function arrowFor(direction: Direction) {
  return direction === "low" ? "⬆️" : direction === "high" ? "⬇️" : "✅";
}

function labelFor(direction: Direction, rel: number) {
  const tier = tierFromRel(rel);

  if (tier === "perfect") return "🎯 Perfect";
  if (tier === "noclue") return "💀 No clue";

  const arrow = arrowFor(direction);

  switch (tier) {
    case "almost":
      return `${arrow} Almost right`;
    case "slight":
      return `${arrow} Close`;
    case "close":
      return `${arrow} Near`;
    case "getting":
      return `${arrow} Getting there`;
    case "way":
      return `${arrow} Way off`;
    default:
      return `${arrow} Off`;
  }
}

function tierColor(tier: Tier): [number, number, number] {
  switch (tier) {
    case "perfect":
      return [34, 197, 94];
    case "almost":
      return [99, 197, 34];
    case "slight":
      return [189, 197, 34];
    case "close":
      return [232, 195, 35];
    case "getting":
      return [251, 146, 60];
    case "way":
      return [197, 34, 34];
    case "noclue":
      return [0, 0, 0];
  }
}

function feedbackVisual(direction: Direction, rel: number) {
  const tier = tierFromRel(rel);
  const rgb = tierColor(tier);

  return {
    bg: toRgba(rgb, tier === "noclue" ? 0.9 : 0.8),
    glow: toRgba(rgb, tier === "noclue" ? 0.55 : 0.7),
    text: labelFor(direction, rel),
    textAlpha: 1,
  };
}

/* ---------- Question rendering ---------- */

function renderQuestionWithGradientAbility(question: string) {
  const m = question.match(
    /^Guess the cooldown of (.+) at rank (\d+)\?$/i
  );
  if (!m) return <>{question}</>;

  const ability = m[1];
  const rank = m[2];

  return (
    <>
      <span style={{ textShadow: HEAVY_TEXT_SHADOW }}>
        Guess the cooldown of{" "}
      </span>

      <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#1E9FFF] to-[#FF8C00] saturate-180">
        {ability}
      </span>

      <span style={{ textShadow: HEAVY_TEXT_SHADOW }}>
        {" "}
        at rank {rank}?
      </span>
    </>
  );
}

/* ---------- Component ---------- */

export default function CooldownGuessOptions({
  question,
  trueCooldown,
  onSolved,
}: {
  question: string;
  trueCooldown: number;
  onSolved?: (guesses: number) => void;
}) {
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [solved, setSolved] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  const guessesCount = attempts.length;
  const last = attempts[attempts.length - 1];
  const inputNumber = useMemo(() => parseSeconds(input), [input]);

  const indicator = useMemo(() => {
    if (!last) return null;
    return feedbackVisual(last.direction, last.rel);
  }, [last]);

  function resetRound() {
    setInput("");
    setAttempts([]);
    setSolved(false);
  }

  function submitGuess() {
    if (solved || inputNumber === null) return;

    const delta = Math.abs(inputNumber - trueCooldown);
    const rel = trueCooldown > 0 ? delta / trueCooldown : 0;

    const EPS = 1e-6;

    let direction: Direction = "correct";
    if (inputNumber < trueCooldown - EPS) direction = "low";
    if (inputNumber > trueCooldown + EPS) direction = "high";

    setAttempts((prev) => [...prev, { guess: inputNumber, direction, rel }]);
    setPulseKey((k) => k + 1);

    if (direction === "correct") {
      setSolved(true);
      onSolved?.(guessesCount + 1);
    }

    setInput("");
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter") submitGuess();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [submitGuess]);

  return (
    <div className="flex flex-col gap-6">
      <div className="w-full text-center">
        <h2 className="text-3xl font-semibold text-gray-200">
          {renderQuestionWithGradientAbility(question)}
        </h2>
      </div>

      <div className="w-full flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center">
        <div className="flex-1 max-w-md">
          <div className="w-full flex rounded-xl border border-white/10 overflow-hidden">
            <div className="flex-[2]">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={solved}
                placeholder={solved ? "Solved" : "Enter cooldown (seconds)"}
                className="w-full bg-transparent text-white outline-none px-4 py-4"
              />
            </div>

            <div
              key={pulseKey}
              className="flex-[1] flex items-center justify-center transition-all duration-200"
              style={{
                background: indicator?.bg,
                boxShadow: indicator
                  ? `inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 18px ${indicator.glow}`
                  : undefined,
              }}
            >
              {indicator && (
                <div
                  className="px-2 text-center text-md font-bold leading-tight text-white"
                  style={{ opacity: indicator.textAlpha }}
                >
                  {indicator.text}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-bold whitespace-nowrap">
            Attempts: {guessesCount}
          </div>

          {solved ? (
            <PrimaryCTA
              onClick={resetRound}
              className="px-6 py-2 min-w-[130px] h-[42px]"
            >
              Play again
            </PrimaryCTA>
          ) : (
            <PrimaryCTA
              className="px-6 py-2 min-w-[130px] h-[42px]"
              disabled={inputNumber === null}
              onClick={submitGuess}
            >
              Lock In
            </PrimaryCTA>
          )}
        </div>
      </div>
    </div>
  );
}
