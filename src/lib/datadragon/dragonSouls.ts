const DRAGON_SOUL_ICON_URLS: Record<string, string> = {
  mountain:
    "https://raw.communitydragon.org/latest/game/data/shared/spells/icons2d/dragonsouliconmountain.png",
};

export function dragonSoulIconUrl(id: string): string | null {
  return DRAGON_SOUL_ICON_URLS[id] ?? null;
}
