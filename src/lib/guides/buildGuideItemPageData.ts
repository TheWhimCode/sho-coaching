import {
  ensureItemsData,
  getItem,
  itemIconUrlFromPath,
} from "@/lib/datadragon/items";
import {
  champSquareUrlById,
  resolveChampionId,
} from "@/lib/datadragon/champions";
import type {
  GuideItemEntry,
  GuideItemPreBuild,
  GuideItemSectionConfig,
  GuideItemPageData,
  GuideItemTab,
  GuideItemTeamComp,
  GuideItemVariant,
  SerializedGuideChampion,
  SerializedGuideItem,
  SerializedGuideItemPreBuild,
  SerializedGuideItemSharedPath,
  SerializedGuideItemStep,
  SerializedGuideItemTeamComp,
  SerializedGuideItemVariant,
} from "./itemGuideTypes";

function serializeItem(entry: GuideItemEntry): SerializedGuideItem | null {
  const row = getItem(String(entry.id));
  if (!row) return null;
  const icon = itemIconUrlFromPath(row.iconPath);
  if (!icon) return null;
  return {
    id: entry.id,
    name: row.name,
    icon,
    title: entry.title ?? row.name,
    explanation: entry.explanation,
  };
}

function serializeChampion(name: string): SerializedGuideChampion {
  const id = resolveChampionId(name);
  return {
    id,
    name,
    icon: champSquareUrlById(id),
  };
}

function serializeTeamComp(
  teamComp: GuideItemTeamComp,
  guideChampion?: string
): SerializedGuideItemTeamComp {
  const allyNames = [...teamComp.ally];
  if (guideChampion) {
    const guideId = resolveChampionId(guideChampion);
    const hasGuide = allyNames.some((name) => resolveChampionId(name) === guideId);
    if (!hasGuide) {
      allyNames.unshift(guideChampion);
    }
  }

  return {
    ally: allyNames.map(serializeChampion),
    enemy: teamComp.enemy.map(serializeChampion),
  };
}

function serializePreBuild(
  preBuild: GuideItemPreBuild | undefined
): SerializedGuideItemPreBuild | null {
  if (!preBuild) return null;

  const starting = preBuild.starting
    .map(serializeItem)
    .filter((x): x is SerializedGuideItem => x != null);
  const bootsBase = serializeItem(preBuild.bootsBase);
  const boots = preBuild.boots
    .map(serializeItem)
    .filter((x): x is SerializedGuideItem => x != null);
  const sell = serializeItem(preBuild.fullBuild.sell);
  const buy = serializeItem(preBuild.fullBuild.buy);

  if (starting.length === 0 || !bootsBase || boots.length === 0 || !sell || !buy) return null;

  return {
    starting,
    startingLink: preBuild.startingLink ?? null,
    bootsBase,
    boots,
    bootsSubheading: preBuild.bootsSubheading ?? null,
    fullBuild: { sell, buy },
  };
}

function serializeVariant(
  variant: GuideItemVariant,
  guideChampion?: string
): SerializedGuideItemVariant | null {
  return {
    id: variant.id,
    label: variant.label,
    header: variant.header,
    description: variant.description,
    teamComp: serializeTeamComp(variant.teamComp, guideChampion),
    goodAgainst: variant.goodAgainst.map(serializeChampion),
    activeChoiceIds: variant.activeChoiceIds,
    activePathIndex: variant.activePathIndex ?? null,
  };
}

function serializeSteps(steps: GuideItemTab["steps"]): SerializedGuideItemStep[] {
  if (!steps) return [];

  return steps.map((step) => {
    if (step.type === "choice") {
      const items = step.items
        .map(serializeItem)
        .filter((x): x is SerializedGuideItem => x != null);
      return { type: "choice" as const, label: step.label, items };
    }

    if (step.type === "branch") {
      return {
        type: "branch" as const,
        branches: step.branches.map((branch) => ({
          afterItemId: branch.afterItemId,
          items: branch.items
            .map(serializeItem)
            .filter((x): x is SerializedGuideItem => x != null),
        })),
      };
    }

    const items = step.items
      .map(serializeItem)
      .filter((x): x is SerializedGuideItem => x != null);
    return { type: "fixed" as const, items };
  });
}

function serializeSharedPath(
  sharedPath: GuideItemTab["sharedPath"]
): SerializedGuideItemSharedPath | null {
  if (!sharedPath) return null;
  const origin = serializeItem(sharedPath.origin);
  if (!origin) return null;

  const paths = sharedPath.paths
    .map((path) => ({
      diverge: path.diverge
        ?.map(serializeItem)
        .filter((x): x is SerializedGuideItem => x != null),
      items: path.items
        .map(serializeItem)
        .filter((x): x is SerializedGuideItem => x != null),
    }))
    .filter((path) => path.items.length > 0);

  if (paths.length === 0) return null;

  return { origin, paths };
}

export async function buildGuideItemPageData(
  config: GuideItemSectionConfig
): Promise<GuideItemPageData> {
  await ensureItemsData();

  return {
    heading: config.heading,
    headerIcon: config.headerIcon ? serializeItem(config.headerIcon) : null,
    preBuild: serializePreBuild(config.preBuild),
    tabs: config.tabs.map((tab) => ({
      id: tab.id,
      label: tab.label,
      subheading: tab.subheading,
      steps: tab.steps ? serializeSteps(tab.steps) : [],
      sharedPath: serializeSharedPath(tab.sharedPath),
      variants: (tab.variants ?? [])
        .map((variant) => serializeVariant(variant, config.guideChampion))
        .filter((x): x is SerializedGuideItemVariant => x != null),
      defaultVariantId: tab.defaultVariantId ?? tab.variants?.[0]?.id ?? null,
    })),
  };
}
