/**
 * Persistent client ID and auto-generated display name for skillcheck leaderboard.
 * Stored in localStorage so the same device gets one identity.
 */

import { getSkillcheckStreak } from "@/app/skillcheck/streak";

const CLIENT_ID_KEY = "skillcheck:leaderboardClientId";
const DISPLAY_NAME_KEY = "skillcheck:leaderboardDisplayName";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sc-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

/** Random display name for first-time leaderboard (e.g. "Guest_x7Kp2") */
function generateDisplayName(): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `Guest_${suffix}`;
}

export function getLeaderboardClientId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id || id.length > 64) {
      id = generateId();
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return generateId();
  }
}

/** Get or create a random display name for the leaderboard. */
export function getOrCreateLeaderboardDisplayName(): string {
  if (typeof window === "undefined") return "";
  try {
    let name = localStorage.getItem(DISPLAY_NAME_KEY);
    if (!name || name.length > 32) {
      name = generateDisplayName();
      localStorage.setItem(DISPLAY_NAME_KEY, name);
    }
    return name;
  } catch {
    return generateDisplayName();
  }
}

/** Update stored display name (e.g. after "you're on the board" popup). */
export function setLeaderboardDisplayName(name: string): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = name.trim().slice(0, 32);
    if (trimmed) localStorage.setItem(DISPLAY_NAME_KEY, trimmed);
  } catch {}
}

const MIN_STREAK_TO_ADD = 5;

export const LEADERBOARD_ADDED_EVENT = "skillcheck:leaderboard-added";

/** Call after recordSkillcheckPlay(); syncs to leaderboard if streak >= 5 (auto-add, no manual submit). Dispatches LEADERBOARD_ADDED_EVENT when user is newly added so UI can show name prompt. */
export function syncToLeaderboardIfEligible(): void {
  if (typeof window === "undefined") return;
  try {
    const streak = getSkillcheckStreak();
    if (streak.streakDays < MIN_STREAK_TO_ADD) return;
    const clientId = getLeaderboardClientId();
    const displayName = getOrCreateLeaderboardDisplayName();
    fetch("/api/skillcheck/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId,
        streakDays: streak.streakDays,
        displayName,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.added === true) {
          window.dispatchEvent(new CustomEvent(LEADERBOARD_ADDED_EVENT));
        }
      })
      .catch(() => {});
  } catch {}
}

/** Call when user visits skillcheck (e.g. rail mounts). If they have an existing leaderboard entry, sync current streak so a skipped day reverts their row to 0. */
export function syncLeaderboardOnVisit(): void {
  if (typeof window === "undefined") return;
  try {
    const clientId = getLeaderboardClientId();
    const streak = getSkillcheckStreak();
    const displayName = getOrCreateLeaderboardDisplayName();
    fetch(`/api/skillcheck/leaderboard?clientId=${encodeURIComponent(clientId)}`)
      .then((r) => r.json())
      .then((data) => {
        const hasEntry = data?.myEntry != null;
        const shouldSync = hasEntry || streak.streakDays >= MIN_STREAK_TO_ADD;
        if (!shouldSync) return;
        return fetch("/api/skillcheck/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId,
            streakDays: streak.streakDays,
            displayName,
          }),
        });
      })
      .catch(() => {});
  } catch {}
}
