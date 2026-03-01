/**
 * Skillcheck streak: consecutive days with at least one completed game (any mode).
 * Stored in localStorage. Call recordSkillcheckPlay() when user solves a puzzle.
 */

const STORAGE_KEY = "skillcheck:streak";
const RENEWED_KEY = "skillcheck:streak-renewed-date";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type StreakState = {
  streakDays: number;
  lastPlayedDate: string | null;
  playedToday: boolean;
};

export function getSkillcheckStreak(): StreakState {
  if (typeof window === "undefined") {
    return { streakDays: 0, lastPlayedDate: null, playedToday: false };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : null;
    const last = data?.lastPlayedDate ?? null;
    let days = typeof data?.streakDays === "number" ? data.streakDays : 0;
    const today = todayKey();
    const yesterday = yesterdayKey();

    if (last === yesterday) {
      // played yesterday, not today — streak still valid but not extended
    } else if (last !== today && last !== yesterday) {
      // missed a day or never played
      days = 0;
    }

    return {
      streakDays: days,
      lastPlayedDate: last,
      playedToday: last === today,
    };
  } catch {
    return { streakDays: 0, lastPlayedDate: null, playedToday: false };
  }
}

/** Call when user completes any skillcheck game (draft correct, cooldowns solved, items solved). */
export function recordSkillcheckPlay(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : { lastPlayedDate: null, streakDays: 0 };
    const today = todayKey();
    const yesterday = yesterdayKey();
    let streak = typeof data.streakDays === "number" ? data.streakDays : 0;

    if (data.lastPlayedDate === today) {
      // already played today, no change
      return;
    }
    if (data.lastPlayedDate === yesterday) {
      streak += 1;
    } else {
      streak = 1;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ lastPlayedDate: today, streakDays: streak })
    );
    // Flag for rail: show celebration once when streak is renewed today
    localStorage.setItem(RENEWED_KEY, today);
  } catch {}
}

/** Returns true if streak was renewed today and clears the flag (so celebration plays once per renewal). */
export function consumeStreakRenewedToday(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const today = todayKey();
    const stored = localStorage.getItem(RENEWED_KEY);
    if (stored === today) {
      localStorage.removeItem(RENEWED_KEY);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
