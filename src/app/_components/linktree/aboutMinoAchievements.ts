import type { RankTier, Role } from "@/lib/datadragon/types";

export type AboutMinoAchievement = {
  tier: RankTier;
  role: Role;
  champions: string[];
};

export const ABOUT_MINO_ACHIEVEMENTS: AboutMinoAchievement[] = [
  {
    tier: "CHALLENGER",
    role: "mid",
    champions: ["Hwei", "Akshan", "Singed", "Galio", "Orianna"],
  },
  {
    tier: "CHALLENGER",
    role: "sup",
    champions: ["Pyke", "Rakan", "Karma", "Taric", "Lulu"],
  },
  {
    tier: "GRANDMASTER",
    role: "jng",
    champions: ["Viego", "Ekko", "Xin Zhao", "Diana"],
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

/** Light pastel pink — nudged darker so it doesn’t read as white on bright displays */
export const ABOUT_MINO_ACCENT = "#F0ABCF";
export const ABOUT_MINO_GLOW = "rgba(244, 114, 182, 0.42)";
export const ABOUT_MINO_ICON_GRADIENT =
  "linear-gradient(145deg, #FBCFE8 0%, #F9A8D4 42%, #F472B6 100%)";
