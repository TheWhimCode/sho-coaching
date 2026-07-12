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

export type GuideGameStageInvaderEntry = {
  id: string;
  champion?: string;
  champions?: string[];
  label: string;
};

export type GuideGameStageExternalLink = {
  label: string;
  href: string;
};

export type GuideGameStageQuote = {
  lead?: string;
  text: string;
};

export type GuideGameStageTopic = {
  id: string;
  label: string;
  summary?: string;
  /** Multi-paragraph body — separate paragraphs with blank lines. */
  body: string;
  /** Optional copy rendered after the banner image. */
  bodyAfterBanner?: string;
  /** Optional styled pull quote shown after body / banner content. */
  quote?: GuideGameStageQuote;
  /** Optional highlighted step cards (e.g. Step 1 / Step 2). Rendered after the first body paragraph. */
  steps?: GuideGameStageStep[];
  /** Optional invader list with champion icons, rendered after the first body paragraph. */
  invaderList?: GuideGameStageInvaderEntry[];
  /** Optional external link (e.g. TikTok) rendered after the body copy. */
  externalLink?: GuideGameStageExternalLink;
  /** Optional copy rendered after the external link. */
  bodyAfterExternalLink?: string;
  videos?: GuideGameStageVideo[];
  /** Optional copy rendered after mid-content videos and before trailing videos. */
  bodyBetweenVideos?: string;
  /** Optional videos rendered after `bodyBetweenVideos`. */
  videosAfterBody?: GuideGameStageVideo[];
  /** Optional copy rendered after topic videos. */
  bodyAfterVideos?: string;
  /** Full-width banner image shown below the body copy. */
  bannerImageSrc?: string;
  bannerImageAlt?: string;
  /** Show a "New" badge on this topic chip. */
  isNew?: boolean;
  disabled?: boolean;
};

export type GuideGameStageCategory = {
  id: string;
  label: string;
  subtitle?: string;
  /** Show a "New" badge on this category tab. */
  isNew?: boolean;
  topics: GuideGameStageTopic[];
};

export type GuideGameStageSectionConfig = {
  heading: string;
  subtitle?: string;
  categories: GuideGameStageCategory[];
};

export type GuideGameStagePageData = GuideGameStageSectionConfig;
