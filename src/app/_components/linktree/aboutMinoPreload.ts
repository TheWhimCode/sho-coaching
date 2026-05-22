import { championAvatarByName, rankMiniCrestSvg } from "@/lib/league/datadragon";
import { ROLE_ICONS } from "@/lib/datadragon/roles";
import { ABOUT_MINO_ACHIEVEMENTS } from "./aboutMinoAchievements";

/** Rank crests, role icons, and champion avatars used in the About Mino panel */
export function aboutMinoPreloadImageUrls(): string[] {
  const urls = new Set<string>();

  for (const a of ABOUT_MINO_ACHIEVEMENTS) {
    urls.add(rankMiniCrestSvg(a.tier));
    urls.add(ROLE_ICONS[a.role]);
    for (const champ of a.champions) {
      urls.add(championAvatarByName(champ));
    }
  }

  return [...urls];
}

export const ABOUT_MINO_PRELOAD_IMAGES = aboutMinoPreloadImageUrls();
