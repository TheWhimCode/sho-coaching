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
  heading: string;
  subheading?: string;
  /** Optional crossed-out keystone shown beside the section heading (e.g. Conqueror). */
  headerIconPerkId?: number;
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
  /** Unified secondary-tree write-up shown beside the keystone explanation. */
  precisionSection?: {
    title: string;
    body: string;
  };
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

export type GuideRunePageData = {
  build: GuideRuneBuild;
  primaryTree: SerializedRuneTree;
  secondaryTree: SerializedRuneTree;
  summonerSpellIcons: Record<number, string>;
  statShardRows: SerializedStatShardRow[];
  headerIcon: SerializedRune | null;
};
