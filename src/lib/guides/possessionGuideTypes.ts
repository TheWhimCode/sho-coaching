export type GuidePossessionFlowStep = {
  id: string;
  label: string;
  /** Show Viego R icon on this step when provided by the section. */
  highlightR?: boolean;
};

export type GuidePossessionFactor = {
  id: string;
  label: string;
  text: string;
};

export type GuidePossessionDontItem = {
  id: string;
  text: string;
};

export type GuidePossessionAbilityKey = "Q" | "W" | "E";

export type GuideChampionAbilityIcons = Partial<Record<GuidePossessionAbilityKey, string>>;

export type GuidePossessionChampionEntry = {
  champion: string;
  explanation?: string;
};

export type GuidePossessionTier = {
  id: string;
  label: string;
  champions: GuidePossessionChampionEntry[];
};

export type GuidePossessionSectionConfig = {
  heading: string;
  isNew?: boolean;
  subtitle?: string;
  howItWorksHeading: string;
  howItWorksNote?: string;
  /** Prose paragraphs shown below the numbered how-it-works steps. */
  howItWorksDetails?: string[];
  /** Champion passives appended to the first how-it-works detail paragraph. */
  howItWorksPassiveExamples?: string[];
  flow: GuidePossessionFlowStep[];
  bestToPossessHeading: string;
  bestToPossessIntro: string;
  factors: GuidePossessionFactor[];
  bestToPossessNote?: string;
  possessionTiers: GuidePossessionTier[];
  whenNotToPossessHeading: string;
  whenNotToPossessIntro?: string;
  whenNotToPossessDontLabel?: string;
  whenNotToPossessItems: GuidePossessionDontItem[];
};

export type SerializedPossessionPassiveExample = {
  id: string;
  name: string;
  passiveName: string;
  passiveIcon: string;
  passiveDescriptionHtml: string;
};

export type SerializedPossessionChampion = {
  id: string;
  name: string;
  icon: string;
  abilityIcons: GuideChampionAbilityIcons;
  explanation?: string;
};

export type SerializedPossessionTier = {
  id: string;
  label: string;
  champions: SerializedPossessionChampion[];
};

export type GuidePossessionPageData = {
  heading: string;
  isNew?: boolean;
  subtitle?: string;
  howItWorksHeading: string;
  howItWorksNote?: string;
  /** Prose paragraphs shown below the numbered how-it-works steps. */
  howItWorksDetails?: string[];
  howItWorksPassiveExamples?: SerializedPossessionPassiveExample[];
  flow: GuidePossessionFlowStep[];
  bestToPossessHeading: string;
  bestToPossessIntro: string;
  factors: GuidePossessionFactor[];
  bestToPossessNote?: string;
  possessionTiers: SerializedPossessionTier[];
  whenNotToPossessHeading: string;
  whenNotToPossessIntro?: string;
  whenNotToPossessDontLabel?: string;
  whenNotToPossessItems: GuidePossessionDontItem[];
};
