import {
  champSquareUrlById,
  resolveChampionId,
} from "@/lib/datadragon/champions";
import type {
  GuideMatchupSectionConfig,
  GuideMatchupPageData,
  SerializedGuideMatchup,
} from "./matchupGuideTypes";

function serializeMatchup(
  champion: string,
  explanation: string
): SerializedGuideMatchup {
  const id = resolveChampionId(champion);
  return {
    id,
    name: champion,
    icon: champSquareUrlById(id),
    explanation,
  };
}

export function buildGuideMatchupPageData(
  config: GuideMatchupSectionConfig
): GuideMatchupPageData {
  return {
    columns: config.columns.map((column) => ({
      id: column.id,
      label: column.label,
      subtitle: column.subtitle,
      tone: column.tone,
      matchups: column.matchups.map((entry) =>
        serializeMatchup(entry.champion, entry.explanation)
      ),
    })),
  };
}
