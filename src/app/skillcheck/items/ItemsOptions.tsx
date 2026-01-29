"use client";

import { useEffect, useMemo, useState } from "react";
import PrimaryCTA from "@/app/_components/small/buttons/PrimaryCTA";

type Direction = "low" | "high" | "correct";
type Attempt = { guess: number; direction: Direction; delta: number };

type Tier = "perfect" | "almost" | "close" | "getting" | "way" | "noclue";

function parseGold(input: string): number | null {
  const m = input.trim().match(/-?\d+/);
  if (!m) return null;
  const n = Number(m[0]);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.round(n));
}

/* ---------- NEW: absolute-delta tiering ---------- */

function tierFromDelta(delta: number): Tier {
  if (delta === 0) return "perfect";
  if (delta <= 50) return "almost";
  if (delta <= 100) return "close";
  if (delta <= 300) return "getting";
  if (delta <= 500) return "way";
  return "noclue";
}

function arrowFor(direction: Direction) {
  return direction === "low" ? "⬆️" : direction === "high" ? "⬇️" : "✅";
}

function labelFor(direction: Direction, delta: number) {
  const tier = tierFromDelta(delta);
  if (tier === "perfect") return "🎯 Perfect";
  if (tier === "noclue") return "💀 No clue";

  const arrow = arrowFor(direction);

  if (tier === "almost") return `${arrow} Almost right`;
  if (tier === "close") return `${arrow} Close`;
  if (tier === "getting") return `${arrow} Getting there`;
  return `${arrow} Way off`;
}

function toRgba(rgb: [number, number, number], a: number) {
  const [r, g, b] = rgb;
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
}

function tierColor(tier: Tier): [number, number, number] {
  switch (tier) {
    case "perfect":
      return [34, 197, 94];
    case "almost":
      return [99, 197, 34];
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

function feedbackVisual(direction: Direction, delta: number) {
  const tier = tierFromDelta(delta);
  const rgb = tierColor(tier);
  return {
    bg: toRgba(rgb, tier === "noclue" ? 0.9 : 0.8),
    glow: toRgba(rgb, tier === "noclue" ? 0.55 : 0.7),
    text: labelFor(direction, delta),
  };
}

/* ---------- Question rendering (gradient item name) ---------- */

const HEAVY_TEXT_SHADOW =
  "0 0 10px rgba(0,0,0,0.95), 0 0 22px rgba(0,0,0,0.95), 0 0 36px rgba(0,0,0,0.95)";

function renderQuestionWithGradientItem(itemName: string) {
  return (
    <>
      <span style={{ textShadow: HEAVY_TEXT_SHADOW }}>How much gold to buy </span>
      <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#1E9FFF] to-[#FF8C00] saturate-180">
        {itemName}
      </span>
      <span style={{ textShadow: HEAVY_TEXT_SHADOW }}>?</span>
    </>
  );
}

export default function ItemsOptions({
  targets,
  inventory,
  trueGold,
  storageKey,
  onSolved,
}: {
  targets: { id: string; name: string; icon: string }[];
  inventory: { id: string; name: string; icon: string }[];
  trueGold: number;
  storageKey: string;
  onSolved?: (guesses: number) => void;
}) {
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [solved, setSolved] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  const guessesCount = attempts.length;
  const last = attempts[attempts.length - 1];
  const inputNumber = useMemo(() => parseGold(input), [input]);

  const indicator = useMemo(() => {
    if (!last) return null;
    return feedbackVisual(last.direction, last.delta);
  }, [last]);

  function writeStorage(
    patch: Partial<{ attempts: Attempt[]; completed: boolean }>
  ) {
    try {
      const raw = localStorage.getItem(storageKey);
      const s = raw ? JSON.parse(raw) : {};
      localStorage.setItem(storageKey, JSON.stringify({ ...s, ...patch }));
    } catch {}
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const s = JSON.parse(raw);

      if (Array.isArray(s.attempts)) setAttempts(s.attempts);
      if (typeof s.completed === "boolean") setSolved(s.completed);
    } catch {}
  }, [storageKey]);

  function submitGuess() {
    if (solved || inputNumber === null) return;

    const delta = Math.abs(inputNumber - trueGold);

    let direction: Direction = "correct";
    if (inputNumber < trueGold) direction = "low";
    if (inputNumber > trueGold) direction = "high";

    const nextAttempt: Attempt = { guess: inputNumber, direction, delta };

    setAttempts((prev) => {
      const next = [...prev, nextAttempt];
      writeStorage({ attempts: next });
      return next;
    });

    setPulseKey((k) => k + 1);

    if (direction === "correct") {
      setSolved(true);
      writeStorage({ completed: true });
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
  }, [inputNumber, solved, trueGold, guessesCount]);

  const itemName =
    targets.length === 1
      ? targets[0].name
      : `${targets[0].name} and ${targets[1].name}`;

  const questionNode = renderQuestionWithGradientItem(itemName);

  return (
    <div className="flex flex-col gap-6 px-2 md:px-0">
      <div className="w-full text-center">
        <h2 className="text-3xl font-semibold text-gray-200">{questionNode}</h2>
      </div>

      <div className="w-full flex flex-nowrap gap-3 items-center justify-center">
        <div className="flex-1 min-w-0 max-w-md">
          <div className="w-full flex rounded-xl border border-white/10 overflow-hidden">
            <div className="flex-[2] min-w-0">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={solved}
                placeholder={solved ? "Solved" : "Enter gold (e.g. 1450)"}
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
                <div className="px-2 text-center text-md font-bold text-white">
                  {indicator.text}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative flex-shrink-0">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-bold whitespace-nowrap">
            Attempts: {guessesCount}
          </div>

          <PrimaryCTA
            className="px-6 py-2 min-w-[130px] h-[42px]"
            disabled={solved || inputNumber === null}
            onClick={submitGuess}
          >
            Lock In
          </PrimaryCTA>
        </div>
      </div>
    </div>
  );
}
