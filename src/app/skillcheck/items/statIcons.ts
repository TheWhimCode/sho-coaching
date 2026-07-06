/**
 * Item stat icons for skillcheck items result.
 * Icons are served from Cloudflare at `league/` (e.g. `https://videos.its-mino.com/league/AS.webp`).
 */

import { leagueStatIcon } from "@/lib/coaching/coachingClipVideos";

/** Stat phrase (from item description) → icon filename on the league CDN. */
const STAT_ICON_MAP: Record<string, string> = {
  "attack damage": "AD.webp",
  "ad": "AD.webp",
  "ability power": "AP.webp",
  "ap": "AP.webp",
  "adaptive force": "AD.webp",
  "ability haste": "AH.webp",
  "ah": "AH.webp",
  "armor": "Armor.webp",
  "magic resist": "MR.webp",
  "magic resistance": "MR.webp",
  "mr": "MR.webp",
  "health": "Health.webp",
  "health regen": "HealthRegen.webp",
  "health regeneration": "HealthRegen.webp",
  "mana": "Mana.webp",
  "mana regen": "ManaRegen.webp",
  "mana regeneration": "ManaRegen.webp",
  "attack speed": "AS.webp",
  "as": "AS.webp",
  "movement speed": "MS.webp",
  "move speed": "MS.webp",
  "ms": "MS.webp",
  "tenacity": "Tenacity.webp",
  "lethality": "ArmorPen.webp",
  "armor penetration": "ArmorPen.webp",
  "magic penetration": "MagicPen.webp",
  "magic pen": "MagicPen.webp",
  "critical strike": "Crit.webp",
  "crit": "Crit.webp",
  "life steal": "LifeSteal.webp",
  "lifesteal": "LifeSteal.webp",
  "omnivamp": "Omnivamp.webp",
  "heal and shield power": "HealAndShield.webp",
  "heal and shield": "HealAndShield.webp",
  "attack range": "Range.webp",
  "range": "Range.webp",
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
  return leagueStatIcon(file);
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
      return file ? leagueStatIcon(file) : undefined;
    }
  }
  return undefined;
}
