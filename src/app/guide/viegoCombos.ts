import type { GuideComboSectionConfig } from "@/lib/guides/comboGuideTypes";

export const VIEGO_COMBO_SECTION: GuideComboSectionConfig = {
  heading: "Combos",
  subtitle: "Clips and when to use each combo",
  combos: [
    {
      id: "fast-reset",
      label: "Fast reset",
      videoEmbedUrl: null,
      explanation:
        "Your bread and butter. W in, auto, Q, R if needed. Use when you can kill with one rotation and need the reset immediately.",
    },
    {
      id: "charged-w",
      label: "Charged W stun",
      videoEmbedUrl: null,
      explanation:
        "Hold W for the full stun when they have flash or dash up. Best for ganks and setting up guaranteed Q.",
    },
    {
      id: "teamfight",
      label: "Teamfight reset",
      videoEmbedUrl: null,
      explanation:
        "Go for the carry, kill, transform, then use their abilities to keep fighting. Don't R until you know the reset wins the fight.",
    },
  ],
};
