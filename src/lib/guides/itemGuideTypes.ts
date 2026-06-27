export type GuideItemEntry = {
  id: number;
  /** Optional short headline — defaults to item name from Data Dragon */
  title?: string;
  explanation: string;
};

export type GuideItemBuildStep =
  | {
      type: "choice";
      label?: string;
      items: GuideItemEntry[];
    }
  | {
      type: "fixed";
      items: GuideItemEntry[];
    }
  | {
      /** One follow-up item per row — aligns with the previous choice column. */
      type: "branch";
      branches: {
        /** Must match an item id from the prior choice step at the same row index. */
        afterItemId: number;
        items: GuideItemEntry[];
      }[];
    };

/** @deprecated Use GuideItemTab inside GuideItemSectionConfig */
export type GuideItemBuild = {
  heading: string;
  subheading?: string;
  steps: GuideItemBuildStep[];
};

export type GuideItemPath = {
  /** Stacked choices after the origin — each connects to origin and the first `items` entry. */
  diverge?: GuideItemEntry[];
  items: GuideItemEntry[];
};

export type GuideItemSharedPath = {
  origin: GuideItemEntry;
  paths: GuideItemPath[];
};

export type GuideItemTeamComp = {
  ally: string[];
  enemy: string[];
};

export type GuideItemPreBuild = {
  starting: GuideItemEntry[];
  startingLink?: {
    label: string;
    href: string;
  };
  bootsBase: GuideItemEntry;
  boots: GuideItemEntry[];
  bootsSubheading?: string;
  fullBuild: {
    sell: GuideItemEntry;
    buy: GuideItemEntry;
  };
};

export type GuideItemVariant = {
  id: string;
  label: string;
  header: string;
  description: string;
  teamComp: GuideItemTeamComp;
  /** Champions this build is strong into — shown below the description. */
  goodAgainst: string[];
  /** Choice / diverge item ids highlighted in the build row. */
  activeChoiceIds: number[];
  /** For shared-path tabs — which row is active (dims the other). */
  activePathIndex?: number;
};

export type GuideItemTab = {
  id: string;
  label: string;
  subheading?: string;
  steps?: GuideItemBuildStep[];
  /** Multiple linear paths sharing the same starting item, stacked vertically. */
  sharedPath?: GuideItemSharedPath;
  preBuild?: GuideItemPreBuild;
  variants?: GuideItemVariant[];
  defaultVariantId?: string;
};

export type GuideItemSectionConfig = {
  heading: string;
  /** Optional icon shown beside the heading (e.g. an item you do not build). */
  headerIcon?: GuideItemEntry;
  /** Shared early-game strip shown on every tab. */
  preBuild?: GuideItemPreBuild;
  /** Always included in variant ally team comps (e.g. the guide champion). */
  guideChampion?: string;
  tabs: GuideItemTab[];
};

export type SerializedGuideItem = {
  id: number;
  name: string;
  icon: string;
  title: string;
  explanation: string;
};

export type SerializedGuideItemStep =
  | {
      type: "choice";
      label?: string;
      items: SerializedGuideItem[];
    }
  | {
      type: "fixed";
      items: SerializedGuideItem[];
    }
  | {
      type: "branch";
      branches: {
        afterItemId: number;
        items: SerializedGuideItem[];
      }[];
    };

export type SerializedGuideItemSharedPath = {
  origin: SerializedGuideItem;
  paths: { diverge?: SerializedGuideItem[]; items: SerializedGuideItem[] }[];
};

export type SerializedGuideChampion = {
  id: string;
  name: string;
  icon: string;
};

export type SerializedGuideItemTeamComp = {
  ally: SerializedGuideChampion[];
  enemy: SerializedGuideChampion[];
};

export type SerializedGuideItemPreBuild = {
  starting: SerializedGuideItem[];
  startingLink: { label: string; href: string } | null;
  bootsBase: SerializedGuideItem;
  boots: SerializedGuideItem[];
  bootsSubheading: string | null;
  fullBuild: {
    sell: SerializedGuideItem;
    buy: SerializedGuideItem;
  };
};

export type SerializedGuideItemVariant = {
  id: string;
  label: string;
  header: string;
  description: string;
  teamComp: SerializedGuideItemTeamComp;
  goodAgainst: SerializedGuideChampion[];
  activeChoiceIds: number[];
  activePathIndex: number | null;
};

export type SerializedGuideItemTab = {
  id: string;
  label: string;
  subheading?: string;
  steps: SerializedGuideItemStep[];
  sharedPath: SerializedGuideItemSharedPath | null;
  variants: SerializedGuideItemVariant[];
  defaultVariantId: string | null;
};

export type GuideItemPageData = {
  heading: string;
  headerIcon: SerializedGuideItem | null;
  preBuild: SerializedGuideItemPreBuild | null;
  tabs: SerializedGuideItemTab[];
};
