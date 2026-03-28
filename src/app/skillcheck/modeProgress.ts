export type ModeId = "draft" | "cooldowns" | "items" | "runes";

const STORAGE_KEY = "skillcheck:mode-progress";
export const MODE_PROGRESS_UPDATED_EVENT = "skillcheck:modes-updated";

type StoredProgress = {
  dayKey: string;
  modes: Partial<Record<ModeId, boolean>>;
};

/** UTC calendar day YYYY-MM-DD (same boundary as skillcheck daily puzzles). */
export function dayKeyUTC(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function readStored(): StoredProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredProgress;
    if (!parsed || typeof parsed.dayKey !== "string" || typeof parsed.modes !== "object") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getTodayModeProgress(): Record<ModeId, boolean> {
  if (typeof window === "undefined") {
    return { draft: false, cooldowns: false, items: false, runes: false };
  }
  const today = dayKeyUTC();
  const stored = readStored();
  if (!stored || stored.dayKey !== today) {
    return { draft: false, cooldowns: false, items: false, runes: false };
  }
  return {
    draft: !!stored.modes.draft,
    cooldowns: !!stored.modes.cooldowns,
    items: !!stored.modes.items,
    runes: !!stored.modes.runes,
  };
}

export function markModeCompletedToday(mode: ModeId): void {
  if (typeof window === "undefined") return;
  try {
    const today = dayKeyUTC();
    const stored = readStored();
    const base: StoredProgress =
      stored && stored.dayKey === today
        ? stored
        : { dayKey: today, modes: {} };
    base.modes[mode] = true;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(base));
    window.dispatchEvent(new CustomEvent(MODE_PROGRESS_UPDATED_EVENT));
  } catch {
    // ignore
  }
}

