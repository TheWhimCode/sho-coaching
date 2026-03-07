"use client";

import { useState, useEffect, useCallback } from "react";
import { Flame } from "lucide-react";
import { getLeaderboardClientId } from "@/app/skillcheck/leaderboard-client-id";
import Hero from "@/app/skillcheck/layout/Hero";

type Entry = { displayName: string; streakDays: number; updatedAt: string };

export default function LeaderboardClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      const clientId = getLeaderboardClientId();
      const url = clientId
        ? `/api/skillcheck/leaderboard?clientId=${encodeURIComponent(clientId)}`
        : "/api/skillcheck/leaderboard";
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data.entries)) setEntries(data.entries);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  return (
    <Hero
      hero={
        <div className="w-full max-w-xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
              Streak Leaderboard
            </span>
          </h1>

          <p className="mt-2 text-lg text-white/60">To get on the leaderboard, get your streak to 5!</p>

          {/* Leaderboard list */}
          <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.04] overflow-hidden">
            {loading ? (
              <div className="py-8 text-sm text-white/50">Loading…</div>
            ) : entries.length === 0 ? (
              <div className="py-8 text-sm text-white/50">No scores yet. Add yours above!</div>
            ) : (
              <ul className="divide-y divide-white/10">
                {entries.map((e, i) => (
                  <li
                    key={`${e.displayName}-${e.streakDays}-${i}`}
                    className="flex items-center pl-4 pr-5 py-3 gap-3"
                  >
                    <span className="text-white/50 tabular-nums w-6 shrink-0">{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-white/90 font-medium text-left">
                      {e.displayName}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[var(--color-orange)] font-semibold">
                      <Flame className="h-4 w-4 shrink-0" />
                      {e.streakDays}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      }
      content={null}
    />
  );
}
