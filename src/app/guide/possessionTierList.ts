/** Possession tier labels. Champion placement comes from possessionValues.ts. */
export const POSSESSION_TIER_LIST = [
  { id: "perfect", label: "Perfect", subtitle: "Fight is won" },
  { id: "great", label: "Great", subtitle: "Usually another kill" },
  { id: "good", label: "Good", subtitle: "Often useful" },
  { id: "okay", label: "Okay", subtitle: "Situationally okay" },
  { id: "useless", label: "Useless", subtitle: "Usually you just die" },
] as const;

export type PossessionTierListId = (typeof POSSESSION_TIER_LIST)[number]["id"];
