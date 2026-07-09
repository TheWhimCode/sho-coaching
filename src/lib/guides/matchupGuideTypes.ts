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

export type GuideJungleTierMatchupEntry = {
  champion: string;
  possessionValue: number;
  explanation?: string;
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
  name: string;
  icon: string;
  possessionValue: number;
  explanation: string | null;
  hasExplanation: boolean;
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
