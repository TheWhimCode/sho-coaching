export type GuidePossessionFlowStep = {
  id: string;
  label: string;
  /** Show Viego R icon on this step when provided by the section. */
  highlightR?: boolean;
};

export type GuidePossessionRuleIcon =
  | "mobility"
  | "burst"
  | "cc"
  | "survive"
  | "no-reach"
  | "no-damage"
  | "low-hp"
  | "hold-r";

export type GuidePossessionRule = {
  id: string;
  text: string;
  icon: GuidePossessionRuleIcon;
};

export type GuidePossessionSectionConfig = {
  heading: string;
  subtitle?: string;
  howItWorksHeading: string;
  howItWorksNote?: string;
  flow: GuidePossessionFlowStep[];
  strongHeading: string;
  strongRules: GuidePossessionRule[];
  skipHeading: string;
  skipRules: GuidePossessionRule[];
};

export type GuidePossessionPageData = GuidePossessionSectionConfig;
