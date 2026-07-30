export type GuideRuneExplanation = {
  /** Badge number shown on the rune icon — links to the card on the right. */
  order: number;
  perkId: number;
  title: string;
  /** e.g. "DOMINATION", "PRECISION" */
  treeLabel: string;
  body: string;
};

export type GuideRuneBuild = {
  subheading?: string;
  primaryStyleId: number;
  /** [keystone, row1, row2, row3] */
  primaryPerkIds: number[];
  secondaryStyleId: number;
  /** Two perks from different non-keystone rows */
  secondaryPerkIds: number[];
  statShards: {
    offense: number;
    flex: number;
    defense: number;
  };
  summonerSpells: {
    spellIds: number[];
    note: string;
  };
  explanations: GuideRuneExplanation[];
  /** Perk ids marked as situational alternatives (half-circle edge marks). */
  situationalPerkIds?: number[];
  /** Unified secondary-tree write-up shown beside the keystone explanation. */
  secondarySection?: {
    title: string;
    body: string;
  };
};

export type GuideRuneTabConfig = {
  id: string;
  label: string;
  build: GuideRuneBuild;
};

export type GuideRuneSectionConfig = {
  heading: string;
  /** Optional crossed-out keystone shown beside the section heading (e.g. Conqueror). */
  headerIconPerkId?: number;
  defaultTabId?: string;
  tabs: GuideRuneTabConfig[];
};

export type SerializedRune = {
  id: number;
  name: string;
  icon: string;
};

export type SerializedRuneTree = {
  id: number;
  key: string;
  name: string;
  icon: string;
  slots: SerializedRune[][];
};

export type SerializedStatShardRow = {
  selectedId: number;
  shards: SerializedRune[];
};

export type GuideRuneTabPageData = {
  id: string;
  label: string;
  build: GuideRuneBuild;
  primaryTree: SerializedRuneTree;
  secondaryTree: SerializedRuneTree;
  summonerSpellIcons: Record<number, string>;
  statShardRows: SerializedStatShardRow[];
};

export type GuideRunePageData = {
  heading: string;
  headerIcon: SerializedRune | null;
  defaultTabId: string;
  tabs: GuideRuneTabPageData[];
};
