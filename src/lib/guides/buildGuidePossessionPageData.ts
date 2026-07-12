import { champSquareUrlById, resolveChampionId } from "@/lib/datadragon/champions";
import { fetchChampionPassiveById, fetchChampionSpellsById } from "@/lib/datadragon/championspells";
import type {
  GuideChampionAbilityIcons,
  GuidePossessionAbilityKey,
  GuidePossessionChampionEntry,
  GuidePossessionPageData,
  GuidePossessionSectionConfig,
  SerializedPossessionChampion,
  SerializedPossessionPassiveExample,
} from "./possessionGuideTypes";

const CHAMPION_ABILITY_KEYS: GuidePossessionAbilityKey[] = ["Q", "W", "E"];

async function fetchChampionAbilityIcons(championId: string): Promise<GuideChampionAbilityIcons> {
  try {
    const { data } = await fetchChampionSpellsById(championId);
    const icons: GuideChampionAbilityIcons = {};

    for (const spell of data.spells) {
      if (CHAMPION_ABILITY_KEYS.includes(spell.key as GuidePossessionAbilityKey)) {
        icons[spell.key as GuidePossessionAbilityKey] = spell.icon;
      }
    }

    return icons;
  } catch {
    return {};
  }
}

function collectUniqueChampionIds(config: GuidePossessionSectionConfig): string[] {
  const ids = new Set<string>();

  for (const tier of config.possessionTiers) {
    for (const entry of tier.champions) {
      const id = resolveChampionId(entry.champion);
      if (id) ids.add(id);
    }
  }

  return [...ids];
}

async function serializeChampion(
  entry: GuidePossessionChampionEntry,
  abilityIconMap: Map<string, GuideChampionAbilityIcons>
): Promise<SerializedPossessionChampion> {
  const id = resolveChampionId(entry.champion);

  return {
    id,
    name: entry.champion,
    icon: champSquareUrlById(id),
    abilityIcons: abilityIconMap.get(id) ?? {},
    explanation: entry.explanation,
  };
}

async function serializePassiveExamples(
  champions: string[] | undefined
): Promise<SerializedPossessionPassiveExample[]> {
  if (!champions?.length) return [];

  const examples = await Promise.all(
    champions.map(async (champion) => {
      const id = resolveChampionId(champion);
      const passive = await fetchChampionPassiveById(id);
      if (!passive) return null;

      return {
        id,
        name: champion,
        passiveName: passive.name,
        passiveIcon: passive.icon,
        passiveDescriptionHtml: passive.description,
      };
    })
  );

  return examples.filter((example): example is SerializedPossessionPassiveExample => example !== null);
}

export async function buildGuidePossessionPageData(
  config: GuidePossessionSectionConfig
): Promise<GuidePossessionPageData> {
  const championIds = collectUniqueChampionIds(config);
  const abilityIconEntries = await Promise.all(
    championIds.map(async (id) => [id, await fetchChampionAbilityIcons(id)] as const)
  );
  const abilityIconMap = new Map(abilityIconEntries);
  const howItWorksPassiveExamples = await serializePassiveExamples(
    config.howItWorksPassiveExamples
  );

  const possessionTiers = await Promise.all(
    config.possessionTiers.map(async (tier) => ({
      id: tier.id,
      label: tier.label,
      champions: await Promise.all(
        tier.champions.map((entry) => serializeChampion(entry, abilityIconMap))
      ),
    }))
  );

  return {
    heading: config.heading,
    isNew: config.isNew,
    subtitle: config.subtitle,
    howItWorksHeading: config.howItWorksHeading,
    howItWorksNote: config.howItWorksNote,
    howItWorksDetails: config.howItWorksDetails,
    howItWorksPassiveExamples,
    flow: config.flow,
    bestToPossessHeading: config.bestToPossessHeading,
    bestToPossessIntro: config.bestToPossessIntro,
    factors: config.factors,
    bestToPossessNote: config.bestToPossessNote,
    possessionTiers,
    whenNotToPossessHeading: config.whenNotToPossessHeading,
    whenNotToPossessIntro: config.whenNotToPossessIntro,
    whenNotToPossessDontLabel: config.whenNotToPossessDontLabel,
    whenNotToPossessItems: config.whenNotToPossessItems,
  };
}
