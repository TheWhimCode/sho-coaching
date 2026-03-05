/**
 * Item stat icons for skillcheck items result.
 * Icons are served from public/images/league/statIcons/ (e.g. AD.webp, Armor.webp).
 */

const STAT_ICON_BASE = "/images/league/statIcons";

/** Stat phrase (from item description) → icon filename in public/images/league/statIcons. */
const STAT_ICON_MAP: Record<string, string> = {
  "attack damage": "AD.webp",
  "ability power": "AP.webp",
  "adaptive force": "AD.webp",
  "ability haste": "AH.webp",
  "armor": "Armor.webp",
  "magic resist": "MR.webp",
  "magic resistance": "MR.webp",
  "health": "Health.webp",
  "attack speed": "AS.webp",
  "movement speed": "MS.webp",
  "tenacity": "Tenacity.webp",
  "lethality": "ArmorPen.webp",
};

/** Order stat keys by length descending so "magic resistance" matches before "magic resist". */
const STAT_KEYS_ORDERED = Object.keys(STAT_ICON_MAP).sort(
  (a, b) => b.length - a.length
);

/**
 * Returns the local icon path for a stat name (e.g. "Attack Damage", "Ability Haste").
 * Stat name is matched case-insensitively; returns undefined if no icon is defined.
 */
export function statIconUrl(statName: string): string | undefined {
  const key = statName.trim().toLowerCase();
  const file = STAT_ICON_MAP[key];
  if (!file) return undefined;
  return `${STAT_ICON_BASE}/${file}`;
}

/**
 * Given a stat line from item description (e.g. "15 Attack Damage", "20 Ability Haste"),
 * returns the icon path for that stat. Matches the first known stat phrase in the line.
 */
export function statIconUrlFromLine(line: string): string | undefined {
  const lower = line.trim().toLowerCase();
  for (const phrase of STAT_KEYS_ORDERED) {
    if (lower.includes(phrase)) {
      const file = STAT_ICON_MAP[phrase];
      return file ? `${STAT_ICON_BASE}/${file}` : undefined;
    }
  }
  return undefined;
}
