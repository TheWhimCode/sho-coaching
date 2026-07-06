export type GuideGameStageVideo = {
  label?: string;
  videoSrc?: string | null;
  posterSrc?: string | null;
  embedUrl?: string | null;
};

export type GuideGameStageTopic = {
  id: string;
  label: string;
  summary?: string;
  /** Multi-paragraph body — separate paragraphs with blank lines. */
  body: string;
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
