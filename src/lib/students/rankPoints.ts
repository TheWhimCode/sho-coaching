// src/lib/students/rankPoints.ts

// Ordered list of tiers, lower → higher
const TIER_ORDER: string[] = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
];

// Ordered list of divisions, lowest → highest
const DIV_ORDER: string[] = ["IV", "III", "II", "I"];

/**
 * Convert (tier, division, lp) → single comparable number
 */
export function rankToPoints(
  tier: string,
  division: string | null | undefined,
  lp: number
): number {
  const t = (tier ?? "").toUpperCase();
  const d = (division ?? "IV").toUpperCase();

  const tierIdx = Math.max(0, TIER_ORDER.indexOf(t));
  const base = tierIdx * 400; // 4 divisions × 100 LP each

  if (t === "MASTER" || t === "GRANDMASTER" || t === "CHALLENGER") {
    // No divisions above Diamond — just add LP
    return base + Math.max(0, lp);
  }

  const divIdx = DIV_ORDER.indexOf(d);
  const divOffset =
    (DIV_ORDER.length - 1 - Math.max(0, divIdx)) * 100; // I is highest
  return base + divOffset + Math.max(0, lp);
}
