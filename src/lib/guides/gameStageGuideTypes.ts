export type GuideGameStageVideo = {
  label?: string;
  videoSrc?: string | null;
  posterSrc?: string | null;
  embedUrl?: string | null;
};

export type GuideGameStageStep = {
  label: string;
  text: string;
};

export type GuideGameStageTopic = {
  id: string;
  label: string;
  summary?: string;
  /** Multi-paragraph body — separate paragraphs with blank lines. */
  body: string;
  /** Optional highlighted step cards (e.g. Step 1 / Step 2). Rendered after the first body paragraph. */
  steps?: GuideGameStageStep[];
  videos?: GuideGameStageVideo[];
  disabled?: boolean;
};

export type GuideGameStageCategory = {
  id: string;
  label: string;
  subtitle?: string;
  topics: GuideGameStageTopic[];
};

export type GuideGameStageSectionConfig = {
  heading: string;
  subtitle?: string;
  categories: GuideGameStageCategory[];
};

export type GuideGameStagePageData = GuideGameStageSectionConfig;
