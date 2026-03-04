/**
 * Item stat icons from CommunityDragon (perk-images statmods).
 * Individual PNGs — no atlas slicing needed.
 * @see https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods/
 */

const STATMOD_BASE =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perk-images/statmods";

/** Icon filename (no path) for each stat key. */
const STAT_ICON_MAP: Record<string, string> = {
  "attack damage": "statmodsadaptiveforceicon.png",
  "ability power": "statmodsadaptiveforceicon.png",
  "adaptive force": "statmodsadaptiveforceicon.png",
  "ability haste": "statmodscdrscalingicon.png",
  "armor": "statmodsarmoricon.png",
  "magic resist": "statmodsmagicresicon.png",
  "magic resistance": "statmodsmagicresicon.png",
  "health": "statmodshealthplusicon.png",
  "attack speed": "statmodsattackspeedicon.png",
  "movement speed": "statmodsmovementspeedicon.png",
  "tenacity": "statmodstenacityicon.png",
};

/**
 * Returns the full icon URL for a stat name (e.g. "Attack Damage", "Ability Haste").
 * Stat name is matched case-insensitively; returns undefined if no icon is defined.
 */
export function statIconUrl(statName: string): string | undefined {
  const key = statName.trim().toLowerCase();
  const file = STAT_ICON_MAP[key];
  if (!file) return undefined;
  return `${STATMOD_BASE}/${file}`;
}

/** Order stat keys by length descending so "magic resistance" matches before "magic resist". */
const STAT_KEYS_ORDERED = Object.keys(STAT_ICON_MAP).sort(
  (a, b) => b.length - a.length
);

/**
 * Given a stat line from item description (e.g. "15 Attack Damage", "20 Ability Haste"),
 * returns the icon URL for that stat. Matches the first known stat phrase in the line.
 */
export function statIconUrlFromLine(line: string): string | undefined {
  const lower = line.trim().toLowerCase();
  for (const phrase of STAT_KEYS_ORDERED) {
    if (lower.includes(phrase)) {
      const file = STAT_ICON_MAP[phrase];
      return file ? `${STATMOD_BASE}/${file}` : undefined;
    }
  }
  return undefined;
}
