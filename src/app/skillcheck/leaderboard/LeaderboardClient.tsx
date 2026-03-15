"use client";

import { useState, useEffect, useCallback } from "react";
import { Flame } from "lucide-react";
import { getLeaderboardClientId } from "@/app/skillcheck/leaderboard-client-id";
import Hero from "@/app/skillcheck/layout/Hero";

type Entry = {
  displayName: string;
  streakDays: number;
  updatedAt: string;
  avgDraft: number | null;
  avgRunes: number | null;
  avgCooldowns: number | null;
  avgItems: number | null;
};

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
      const text = await res.text();
      if (!text.trim()) return;
      let data: { entries?: unknown };
      try {
        data = JSON.parse(text);
      } catch {
        return;
      }
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
        <div className="w-full max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
              Streak Leaderboard
            </span>
          </h1>

          <p className="mt-2 text-lg text-white/60">To get on the leaderboard, get your streak to 5!</p>

          {/* Leaderboard table */}
          <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.04] overflow-hidden">
            {loading ? (
              <div className="py-8 text-sm text-white/50">Loading…</div>
            ) : entries.length === 0 ? (
              <div className="py-8 text-sm text-white/50">No scores yet. Add yours above!</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-medium uppercase tracking-wider text-white/50">
                      <th className="py-3 pl-2 pr-1 tabular-nums">#</th>
                      <th className="py-3 pl-1 pr-2">Name</th>
                      <th className="py-3 px-2 text-center tabular-nums">Draft</th>
                      <th className="py-3 px-2 text-center tabular-nums">CDs</th>
                      <th className="py-3 px-2 text-center tabular-nums">Items</th>
                      <th className="py-3 px-2 text-center tabular-nums">Runes</th>
                      <th className="py-3 pl-2 pr-1 text-center tabular-nums">Streak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {entries.map((e, i) => (
                      <tr
                        key={`${e.displayName}-${e.streakDays}-${i}`}
                        className="text-sm"
                      >
                        <td className="py-2.5 pl-2 pr-1 tabular-nums text-white/50">{i + 1}</td>
                        <td className="min-w-0 max-w-[140px] truncate py-2.5 pl-1 pr-2 font-medium text-white/90">
                          {e.displayName}
                        </td>
                        <td className="py-2.5 px-2 text-center tabular-nums text-white/70">
                          {e.avgDraft ?? "—"}
                        </td>
                        <td className="py-2.5 px-2 text-center tabular-nums text-white/70">
                          {e.avgCooldowns ?? "—"}
                        </td>
                        <td className="py-2.5 px-2 text-center tabular-nums text-white/70">
                          {e.avgItems ?? "—"}
                        </td>
                        <td className="py-2.5 px-2 text-center tabular-nums text-white/70">
                          {e.avgRunes ?? "—"}
                        </td>
                        <td className="py-2.5 pl-2 pr-1 text-center tabular-nums">
                          <span className="inline-flex items-center gap-1 text-[var(--color-orange)] font-semibold">
                            <Flame className="h-3.5 w-3.5 shrink-0" />
                            {e.streakDays}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      }
      content={null}
    />
  );
}
