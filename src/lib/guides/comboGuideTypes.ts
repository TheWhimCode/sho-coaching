export type GuideComboEntry = {
  id: string;
  label: string;
  /** Embed URL (YouTube iframe src, etc.) — omit for placeholder state. */
  videoEmbedUrl?: string | null;
  explanation: string;
};

export type GuideComboSectionConfig = {
  heading: string;
  subtitle?: string;
  combos: GuideComboEntry[];
};

export type GuideComboPageData = GuideComboSectionConfig;
