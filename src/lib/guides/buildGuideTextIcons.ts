import { statIconUrl } from "@/app/skillcheck/items/statIcons";
import { ensureItemsData, itemIconUrl } from "@/lib/datadragon/items";
import { ensureRunesAssets, runeIconUrl } from "@/lib/datadragon/runes";
import { ensureSummonerSpellsAssets, summonerSpellIconById } from "@/lib/datadragon/summonerspells";
import { GUIDE_TEXT_ENTITIES, type GuideTextEntityIcon } from "@/lib/guides/guideTextEntities";

function resolveEntityIcon(icon: GuideTextEntityIcon): string | null {
  switch (icon.kind) {
    case "item":
      return itemIconUrl(icon.id);
    case "rune":
      return runeIconUrl(icon.id);
    case "spell":
      return summonerSpellIconById(icon.id);
    case "stat":
      return statIconUrl(icon.name) ?? null;
    default:
      return null;
  }
}

export async function buildGuideTextIcons(): Promise<Record<string, string>> {
  await Promise.all([ensureRunesAssets(), ensureItemsData(), ensureSummonerSpellsAssets()]);

  const icons: Record<string, string> = {};

  for (const entity of GUIDE_TEXT_ENTITIES) {
    if (!entity.icon) continue;
    const url = resolveEntityIcon(entity.icon);
    if (url) icons[entity.matchKey] = url;
  }

  return icons;
}
