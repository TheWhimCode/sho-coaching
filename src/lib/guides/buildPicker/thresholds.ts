/** Playground scoring thresholds. Not used by the live recommender yet. */

export type ScoringThresholds = {
  shield: number;
  earlyShield: number;
  lethalityMax: number;
  bastionMax: number;
  titansMin: number;
  physicalMin: number;
  magicDamageMax: number;
  steelcapsBonus: number;
};

export const SCORING_THRESHOLDS: ScoringThresholds = {
  shield: 7,
  earlyShield: 7,
  lethalityMax: 7,
  bastionMax: 12,
  titansMin: 15,
  physicalMin: 3,
  magicDamageMax: 6,
  steelcapsBonus: 1,
};

/** Per-metric chart scale. High/Medium/Low ticks are shared visually; each bar maps its own numbers onto them. */
export type CompositionBarScale = {
  low: number;
  medium: number;
  high: number;
  max: number;
};

const TEAM_SCORE_SCALE: CompositionBarScale = { low: 6, medium: 12, high: 18, max: 25 };

export const COMPOSITION_BAR_SCALES: Record<
  "durability" | "damage" | "cc" | "shields",
  CompositionBarScale
> = {
  durability: TEAM_SCORE_SCALE,
  damage: TEAM_SCORE_SCALE,
  cc: TEAM_SCORE_SCALE,
  shields: { low: 3, medium: 6, high: 9, max: 12 },
};
