import {
  champSquareUrlById,
  resolveChampionId,
} from "@/lib/datadragon/champions";
import type {
  GuideJungleTierMatchupPageData,
  GuideJungleTierMatchupSectionConfig,
  GuideMatchupSectionConfig,
  SerializedJungleTierMatchup,
} from "./matchupGuideTypes";

function buildFeaturedExplanationMap(config: GuideMatchupSectionConfig) {
  const map = new Map<string, string>();

  for (const column of config.columns) {
    for (const entry of column.matchups) {
      map.set(entry.champion.trim().toLowerCase(), entry.explanation);
    }
  }

  return map;
}

function serializeTierMatchup(
  champion: string,
  possessionValue: number,
  explanation: string | undefined,
  featuredExplanations: Map<string, string>
): SerializedJungleTierMatchup {
  const id = resolveChampionId(champion);
  const resolvedExplanation =
    explanation ??
    featuredExplanations.get(champion.trim().toLowerCase()) ??
    null;

  return {
    id,
    name: champion,
    icon: champSquareUrlById(id),
    possessionValue,
    explanation: resolvedExplanation,
    hasExplanation: resolvedExplanation !== null,
  };
}

export function buildGuideJungleTierMatchupPageData(
  config: GuideJungleTierMatchupSectionConfig,
  featuredMatchups?: GuideMatchupSectionConfig
): GuideJungleTierMatchupPageData {
  const featuredExplanations = featuredMatchups
    ? buildFeaturedExplanationMap(featuredMatchups)
    : new Map<string, string>();

  return {
    title: config.title,
    tiers: config.tiers.map((tier) => ({
      id: tier.id,
      label: tier.label,
      subtitle: tier.subtitle,
      tone: tier.tone,
      matchups: tier.matchups.map((entry) =>
        serializeTierMatchup(
          entry.champion,
          entry.possessionValue,
          entry.explanation,
          featuredExplanations
        )
      ),
    })),
  };
}
