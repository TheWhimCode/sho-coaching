/**
 * CommunityDragon stat icons
 * These match the icons used in the League client tooltips.
 */

const BASE =
  "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/statmods";

/**
 * Canonical stat icon map
 * Keys are what YOU use internally (not Riot names).
 */
export const STAT_ICONS = {
  // Offensive
  abilityPower: `${BASE}/statmods_abilitypower_icon.png`,
  attackDamage: `${BASE}/statmods_attackdamage_icon.png`,
  attackSpeed: `${BASE}/statmods_attackspeed_icon.png`,
  abilityHaste: `${BASE}/statmods_abilityhaste_icon.png`,
  critChance: `${BASE}/statmods_criticalstrike_icon.png`,

  // Defensive
  armor: `${BASE}/statmods_armor_icon.png`,
  magicResist: `${BASE}/statmods_magicresist_icon.png`,
  health: `${BASE}/statmods_health_icon.png`,
  healthRegen: `${BASE}/statmods_healthregen_icon.png`,

  // Resources
  mana: `${BASE}/statmods_mana_icon.png`,
  manaRegen: `${BASE}/statmods_manaregen_icon.png`,

  // Utility
  moveSpeed: `${BASE}/statmods_movespeed_icon.png`,
  tenacity: `${BASE}/statmods_tenacity_icon.png`,
  omnivamp: `${BASE}/statmods_omnivamp_icon.png`,
  lifesteal: `${BASE}/statmods_lifesteal_icon.png`,
} as const;

export type StatIconKey = keyof typeof STAT_ICONS;

/**
 * Safe accessor
 * Returns empty string if unknown (so <img> doesn’t explode).
 */
export function getStatIcon(key: StatIconKey | string) {
  return (STAT_ICONS as Record<string, string>)[key] ?? "";
}
