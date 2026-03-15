"use client";

import Hero from "@/app/skillcheck/layout/Hero";
import SuccessOverlay from "@/app/skillcheck/components/SuccessOverlay";
import { useEffect, useRef, useState } from "react";
import { recordSkillcheckPlay } from "@/app/skillcheck/streak";
import { getLeaderboardClientId, syncToLeaderboardIfEligible } from "@/app/skillcheck/leaderboard-client-id";
import { markModeCompletedToday } from "@/app/skillcheck/modeProgress";

export type KeystoneOption = { id: number; name: string; icon: string };

export default function RunesClient({
  dayKey,
  champion,
  options,
  correctKeystoneId,
  storageKey,
  avgAttempts,
  dataNotReady,
  errorLog,
}: {
  dayKey: string;
  champion: { id: string; name?: string; icon: string };
  options: KeystoneOption[];
  correctKeystoneId: number;
  storageKey: string;
  avgAttempts: string;
  dataNotReady: boolean;
  errorLog: string | null;
}) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [attempts, setAttempts] = useState<number[]>([]);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const s = JSON.parse(raw);
      if (!!s.completed) {
        setCompleted(true);
        setShowSuccess(true);
        setAttempts(Array.isArray(s.attempts) ? s.attempts : []);
        if (!hasScrolledRef.current) {
          hasScrolledRef.current = true;
          setShowResult(true);
          setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 500);
        }
      } else if (Array.isArray(s.attempts)) {
        setAttempts(s.attempts);
      }
    } catch {}
  }, [storageKey]);

  function revealAndScrollToResult() {
    if (hasScrolledRef.current) return;
    hasScrolledRef.current = true;
    setShowResult(true);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 500);
  }

  async function handleSelect(selectedKeystoneId: number) {
    if (dataNotReady || correctKeystoneId <= 0) return;

    const nextAttempts = [...attempts, selectedKeystoneId];
    setAttempts(nextAttempts);

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ attempts: nextAttempts })
      );
    } catch {}

    const correct = selectedKeystoneId === correctKeystoneId;

    try {
      await fetch("/api/skillcheck/runes/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayKey,
          championId: champion.id,
          correct,
          clientId: getLeaderboardClientId() || undefined,
        }),
      });
    } catch {}

    if (correct) {
      setCompleted(true);
      recordSkillcheckPlay();
      syncToLeaderboardIfEligible();
      markModeCompletedToday("runes");
      try {
        const raw = localStorage.getItem(storageKey);
        const s = raw ? JSON.parse(raw) : {};
        localStorage.setItem(
          storageKey,
          JSON.stringify({ ...s, completed: true, attempts: nextAttempts })
        );
      } catch {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ completed: true, attempts: nextAttempts })
        );
      }
      setShowSuccess(true);
      revealAndScrollToResult();
    }
  }

  const champName = champion.name ?? champion.id;

  if (dataNotReady) {
    return (
      <Hero
        hero={
          <div className="w-full max-w-xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <img
                src={champion.icon}
                alt=""
                className="w-24 h-24 rounded-2xl border border-white/15 object-cover"
              />
            </div>
            <h2 className="text-xl font-semibold text-white/90">{champName}</h2>
            <p className="mt-4 text-white/70">
              Today&apos;s keystone data isn&apos;t ready yet. The nightly job samples master+ games to pick the most popular keystone — check back later or try again tomorrow.
            </p>
            {errorLog && (
              <pre className="mt-4 text-left text-xs text-white/50 overflow-auto max-h-32 p-3 rounded bg-black/20">
                {errorLog}
              </pre>
            )}
          </div>
        }
        content={null}
      />
    );
  }

  return (
    <>
      {showSuccess && (
        <SuccessOverlay
          durationMs={1900}
          text="Correct!"
          onDone={() => setShowSuccess(false)}
        />
      )}

      <Hero
        hero={
          <div className="w-full flex flex-col items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-white/10 blur-sm" />
                <div className="relative rounded-2xl border border-white/15 bg-white/5 p-1 shadow-lg">
                  <img
                    src={champion.icon}
                    alt=""
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                </div>
              </div>
              <div className="text-left">
                <h2 className="text-xl font-semibold text-white">{champName}</h2>
                <p className="text-white/60 text-sm mt-0.5">
                  What keystone is the most popular for this champion in master+?
                </p>
              </div>
            </div>
          </div>
        }
        content={
          <>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  disabled={completed}
                  className="flex flex-col items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:bg-white/10 hover:border-white/25 disabled:opacity-60 disabled:pointer-events-none transition-all"
                >
                  <img
                    src={opt.icon}
                    alt=""
                    className="w-12 h-12 rounded-lg object-contain"
                  />
                  <span className="text-sm font-medium text-white/90 text-center max-w-[100px]">
                    {opt.name}
                  </span>
                </button>
              ))}
            </div>

            {attempts.length > 0 && !completed && (
              <p className="mt-3 text-sm text-white/50">
                Attempts: {attempts.length}
              </p>
            )}

            <div ref={resultRef}>
              {showResult && completed && (
                <div className="mt-8 p-4 rounded-xl border border-green-500/30 bg-green-500/10">
                  <p className="text-green-200 font-medium">Correct!</p>
                  <p className="text-white/70 text-sm mt-1">
                    Average attempts (all players): {avgAttempts}
                  </p>
                </div>
              )}
            </div>
          </>
        }
      />
    </>
  );
}
