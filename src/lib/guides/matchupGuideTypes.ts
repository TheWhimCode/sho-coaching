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
