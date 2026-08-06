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
    /** One shard, or multiple highlighted options (get 1 / 2 badges). */
    defense: number | number[];
  };
  summonerSpells: {
    spellIds: number[];
    note: string;
  };
  explanations: GuideRuneExplanation[];
  /** Perk ids marked as situational alternatives (numbered option badges). */
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
  selectedIds: number[];
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
