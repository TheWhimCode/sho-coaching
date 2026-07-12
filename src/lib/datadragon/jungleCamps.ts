const JUNGLE_CAMP_BASE =
  "https://raw.communitydragon.org/latest/game/assets/characters";

export const JUNGLE_CAMP_ICON_URLS: Record<string, string> = {
  blue: `${JUNGLE_CAMP_BASE}/sru_blue/hud/bluesentinel_square.png`,
  red: `${JUNGLE_CAMP_BASE}/sru_red/hud/brambleback_square.png`,
  gromp: `${JUNGLE_CAMP_BASE}/sru_gromp/hud/gromp_square.png`,
  krugs: `${JUNGLE_CAMP_BASE}/sru_krug/hud/ancientkrug_square.png`,
  raptors: `${JUNGLE_CAMP_BASE}/sru_razorbeak/hud/razorbeak_square.png`,
  wolves: `${JUNGLE_CAMP_BASE}/sru_murkwolf/hud/greatermurkwolf_square.png`,
  scuttle: `${JUNGLE_CAMP_BASE}/sru_crab/hud/crab_square_0.png`,
};

export function jungleCampIconUrl(id: string): string | null {
  return JUNGLE_CAMP_ICON_URLS[id] ?? null;
}
