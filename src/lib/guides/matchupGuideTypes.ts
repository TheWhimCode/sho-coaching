export type GuideMatchupEntry = {
  champion: string;
  explanation: string;
};

export type GuideMatchupColumn = {
  id: string;
  label: string;
  subtitle: string;
  tone: "hard" | "easy";
  matchups: GuideMatchupEntry[];
};

export type GuideMatchupSectionConfig = {
  columns: GuideMatchupColumn[];
};

export type SerializedGuideMatchup = {
  id: string;
  name: string;
  icon: string;
  explanation: string;
};

export type SerializedGuideMatchupColumn = {
  id: string;
  label: string;
  subtitle: string;
  tone: "hard" | "easy";
  matchups: SerializedGuideMatchup[];
};

export type GuideMatchupPageData = {
  columns: SerializedGuideMatchupColumn[];
};

export type GuideJungleTierTone = "nightmare" | "difficult" | "even" | "favorable" | "free";

export type GuideMatchupSnapshot = {
  invadePressure: number;
  oneVOneThreat: number;
  tempo: number;
};

export type GuideMatchupUpgradeItem = {
  id: number;
  title?: string;
  /** Short purchase-order cue shown beside the item name, e.g. "2nd". */
  purchaseOrder?: string;
};

/** One matchup-specific danger worth surfacing beside the possession value. */
export type GuideMatchupDangerHint = {
  title: string;
  detail?: string;
};

export type SerializedMatchupUpgradeItem = {
  id: number;
  name: string;
  icon?: string;
  purchaseOrder?: string;
};

export type GuideJungleTierMatchupEntry = {
  champion: string;
  banBadge?: "Minos Ban" | "Good Ban";
  explanation?: string;
  snapshot?: GuideMatchupSnapshot;
  gameplayStyle?: string;
  upgradeItem?: GuideMatchupUpgradeItem;
  dangerHint?: GuideMatchupDangerHint;
  isNew?: boolean;
};

export type GuideJungleTier = {
  id: string;
  label: string;
  subtitle: string;
  tone: GuideJungleTierTone;
  matchups: GuideJungleTierMatchupEntry[];
};

export type GuideJungleTierMatchupSectionConfig = {
  title: string;
  tiers: GuideJungleTier[];
};

export type SerializedJungleTierMatchup = {
  id: string;
  banBadge?: "Minos Ban" | "Good Ban";
  name: string;
  icon: string;
  possessionValue: number;
  explanation: string | null;
  hasExplanation: boolean;
  snapshot?: GuideMatchupSnapshot;
  gameplayStyle?: string;
  upgradeItem?: SerializedMatchupUpgradeItem;
  dangerHint?: GuideMatchupDangerHint;
  isNew?: boolean;
};

export type SerializedJungleTier = {
  id: string;
  label: string;
  subtitle: string;
  tone: GuideJungleTierTone;
  matchups: SerializedJungleTierMatchup[];
};

export type GuideJungleTierMatchupPageData = {
  title: string;
  tiers: SerializedJungleTier[];
};
