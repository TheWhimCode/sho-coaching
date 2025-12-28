// /draft/core/draftCore.ts

/* -----------------------------
   Types
----------------------------- */

export type Role = "top" | "jng" | "mid" | "adc" | "sup";
export type Side = "blue" | "red";

export type Pick = {
  role: Role;
  champ: string | null;
};

/* -----------------------------
   Pick order (global)
----------------------------- */

// Global pick order: 0–9
// Blue picks: 0, 3, 4, 7, 8
// Red picks:  1, 2, 5, 6, 9

export const BLUE_GLOBAL = [0, 3, 4, 7, 8] as const;
export const RED_GLOBAL = [1, 2, 5, 6, 9] as const;

/* -----------------------------
   Helpers
----------------------------- */

/**
 * Given side + team index (0–4),
 * returns the global pick number (0–9)
 */
export function getGlobalPick(
  side: Side,
  teamIndex: number
): number {
  return side === "blue"
    ? BLUE_GLOBAL[teamIndex]
    : RED_GLOBAL[teamIndex];
}

/**
 * Inverse helper:
 * given side + global pick (0–9),
 * returns team index (0–4) or -1 if not found
 */
export function getTeamIndexFromGlobalPick(
  side: Side,
  globalPick: number
): number {
  const arr: readonly number[] =
    side === "blue"
      ? BLUE_GLOBAL
      : RED_GLOBAL;

  return arr.indexOf(globalPick);
}
