export type GuideComboAbilityKey = "Q" | "W" | "Wtap" | "Wcharge" | "E" | "R" | "AA";

export type GuideViegoAbilityIcons = Record<"Q" | "W" | "E" | "R", string>;

export type GuideComboEntry = {
  id: string;
  label: string;
  /** Ability order for this combo — use AA for auto attacks. */
  sequence?: GuideComboAbilityKey[];
  /** Local path or remote clip URL (e.g. `https://videos.its-mino.com/foo.webm`). */
  videoSrc?: string | null;
  /** Poster shown before the combo clip plays. */
  posterSrc?: string | null;
  /** Embed URL (YouTube iframe src, etc.). */
  videoEmbedUrl?: string | null;
  /** Optional in-game example clip for the same combo. */
  ingameExampleVideoSrc?: string | null;
  /** Poster shown before the ingame example plays. */
  ingamePosterSrc?: string | null;
  ingameExampleVideoEmbedUrl?: string | null;
  explanation: string;
};

export type GuideComboSectionConfig = {
  heading: string;
  subtitle?: string;
  combos: GuideComboEntry[];
};

export type GuideComboPageData = GuideComboSectionConfig;
