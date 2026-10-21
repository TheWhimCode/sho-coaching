/** Scoring thresholds. Live picker and playground share these. */

export type ScoringThresholds = {
  shield: number;
  earlyShield: number;
  lethalityMax: number;
  bastionMax: number;
  titansMin: number;
  forgedMomentumMax: number;
  hubrisCcMin: number;
  physicalMin: number;
  magicDamageMax: number;
  steelcapsBonus: number;
};

export const SCORING_THRESHOLDS: ScoringThresholds = {
  shield: 7,
  earlyShield: 7,
  lethalityMax: 7,
  bastionMax: 11,
  titansMin: 15,
  forgedMomentumMax: 12,
  hubrisCcMin: 8,
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

/** Live boot picker. First matching combat boot wins, then Swifties vs Gluttonous. */
export const BOOT_THRESHOLDS = {
  swiftiesDurabilityMax: 12,
  steelcapsAdMin: 3,
  steelcapsMagicSecond: 3,
  steelcapsMagicThird: 5,
  steelcapsMagicFourth: 7,
  mercsScoreMin: 9,
  mercsDamageThird: 12,
  mercsDamageFourth: 14,
} as const;

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
