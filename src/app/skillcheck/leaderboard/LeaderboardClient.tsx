"use client";

import { useState, useEffect, useCallback } from "react";
import { Flame } from "lucide-react";
import { getSkillcheckStreak } from "@/app/skillcheck/streak";
import {
  getLeaderboardClientId,
  setLeaderboardDisplayName,
} from "@/app/skillcheck/leaderboard-client-id";
import Hero from "@/app/skillcheck/layout/Hero";

type Entry = { displayName: string; streakDays: number; updatedAt: string };
type MyEntry = { displayName: string; streakDays: number } | null;

export default function LeaderboardClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [myEntry, setMyEntry] = useState<MyEntry>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editName, setEditName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      const clientId = getLeaderboardClientId();
      const url = clientId
        ? `/api/skillcheck/leaderboard?clientId=${encodeURIComponent(clientId)}`
        : "/api/skillcheck/leaderboard";
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data.entries)) setEntries(data.entries);
      if (data.myEntry != null) setMyEntry(data.myEntry);
      else setMyEntry(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  function startEditName() {
    setEditName(myEntry?.displayName ?? "");
    setShowNameInput(true);
  }

  async function saveName() {
    setSubmitting(true);
    try {
      const clientId = getLeaderboardClientId();
      const name = editName.trim().slice(0, 16);
      const streak = getSkillcheckStreak();
      await fetch("/api/skillcheck/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          streakDays: streak.streakDays,
          displayName: name || null,
        }),
      });
      if (name) setLeaderboardDisplayName(name);
      setShowNameInput(false);
      await fetchEntries();
    } finally {
      setSubmitting(false);
    }
  }

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

          {/* Edit my name: only when user is on the board */}
          {myEntry && !showNameInput && (
            <div className="mt-3">
              <button
                type="button"
                onClick={startEditName}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Edit my name
              </button>
            </div>
          )}
          {showNameInput && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value.slice(0, 16))}
                placeholder="Display name"
                className="rounded-xl border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 w-48"
                maxLength={16}
              />
              <button
                type="button"
                onClick={saveName}
                disabled={submitting}
                className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShowNameInput(false)}
                className="rounded-xl px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

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
