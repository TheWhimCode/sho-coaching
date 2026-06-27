import type { RunesTree } from "@/lib/datadragon/types";
import {
  getStatShardIconUrl,
  getStatShardName,
  STAT_SHARD_ROW_OPTIONS,
} from "@/lib/datadragon/runes";
import {
  ensureSummonerSpellsAssets,
  summonerSpellIconById,
} from "@/lib/datadragon/summonerspells";
import type {
  GuideRuneBuild,
  GuideRunePageData,
  SerializedRune,
  SerializedRuneTree,
} from "./runeGuideTypes";

function findRuneInTrees(trees: RunesTree[], perkId: number): SerializedRune | null {
  for (const tree of trees) {
    for (const slot of tree.slots ?? []) {
      for (const rune of slot.runes ?? []) {
        if (rune.id === perkId) {
          return {
            id: rune.id,
            name: rune.name ?? "",
            icon: `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`,
          };
        }
      }
    }
  }
  return null;
}

function serializeTree(tree: RunesTree): SerializedRuneTree {
  return {
    id: tree.id,
    key: tree.key,
    name: tree.key,
    icon: `https://ddragon.leagueoflegends.com/cdn/img/${tree.icon}`,
    slots: (tree.slots ?? []).map((slot) =>
      (slot.runes ?? []).map((rune) => ({
        id: rune.id,
        name: rune.name ?? "",
        icon: `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`,
      }))
    ),
  };
}

export async function buildGuideRunePageData(
  build: GuideRuneBuild,
  trees: RunesTree[]
): Promise<GuideRunePageData> {
  await ensureSummonerSpellsAssets();

  const primaryTree = trees.find((t) => t.id === build.primaryStyleId);
  const secondaryTree = trees.find((t) => t.id === build.secondaryStyleId);

  if (!primaryTree || !secondaryTree) {
    throw new Error("Guide rune build references unknown rune tree");
  }

  const summonerSpellIcons: Record<number, string> = {};
  for (const id of build.summonerSpells.spellIds) {
    const icon = summonerSpellIconById(id);
    if (icon) summonerSpellIcons[id] = icon;
  }

  const selectedByRow = [
    build.statShards.offense,
    build.statShards.flex,
    build.statShards.defense,
  ];

  const statShardRows = STAT_SHARD_ROW_OPTIONS.map((optionIds, rowIdx) => ({
    selectedId: selectedByRow[rowIdx],
    shards: optionIds.map((id) => {
      const icon = getStatShardIconUrl(id);
      return {
        id,
        name: getStatShardName(id),
        icon: icon ?? "",
      };
    }).filter((s) => s.icon),
  }));

  return {
    build,
    primaryTree: serializeTree(primaryTree),
    secondaryTree: serializeTree(secondaryTree),
    summonerSpellIcons,
    statShardRows,
    headerIcon: build.headerIconPerkId
      ? findRuneInTrees(trees, build.headerIconPerkId)
      : null,
  };
}
