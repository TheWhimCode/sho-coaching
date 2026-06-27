import { fetchChampionSpellsById } from "@/lib/datadragon/championspells";
import type { GuideViegoAbilityIcons } from "./comboGuideTypes";

export async function buildGuideViegoAbilityIcons(): Promise<GuideViegoAbilityIcons> {
  const { data } = await fetchChampionSpellsById("Viego");
  const icons = {} as GuideViegoAbilityIcons;

  for (const spell of data.spells) {
    icons[spell.key] = spell.icon;
  }

  return icons;
}
