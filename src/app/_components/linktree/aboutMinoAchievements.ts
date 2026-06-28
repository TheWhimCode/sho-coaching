import type { RankTier, Role } from "@/lib/datadragon/types";

export type AboutMinoAchievement = {
  tier: RankTier;
  role: Role;
  champions: string[];
};

export const ABOUT_MINO_ACHIEVEMENTS: AboutMinoAchievement[] = [
  {
    tier: "CHALLENGER",
    role: "jng",
    champions: ["Viego", "Ekko", "Xin Zhao", "Diana"],
  },
  {
    tier: "CHALLENGER",
    role: "mid",
    champions: ["Hwei", "Akshan", "Singed", "Galio", "Orianna"],
  },
  {
    tier: "CHALLENGER",
    role: "sup",
    champions: ["Pyke", "Rakan", "Karma", "Taric", "Lulu", "Yuumi"],
  },
  {
    tier: "MASTER",
    role: "adc",
    champions: ["Smolder", "Kai'sa"],
  },
  {
    tier: "MASTER",
    role: "top",
    champions: ["Poppy", "Camille"],
  },
];

/** Soft pastel pink-lavender */
export const ABOUT_MINO_ACCENT = "#F5B8D9";
export const ABOUT_MINO_ACCENT_SOFT = "#FDF2F8";
export const ABOUT_MINO_GLOW = "rgba(251, 182, 206, 0.5)";
export const ABOUT_MINO_ICON_GRADIENT =
  "linear-gradient(145deg, #FDF2F8 0%, #FBCFE8 38%, #F9A8D4 72%, #F472B6 100%)";
