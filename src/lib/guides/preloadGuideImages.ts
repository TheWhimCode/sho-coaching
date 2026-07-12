import type { GuideItemPageData, SerializedGuideItem } from "@/lib/guides/itemGuideTypes";
import type { GuideMatchupPageData } from "@/lib/guides/matchupGuideTypes";
import type { GuideRunePageData } from "@/lib/guides/runeGuideTypes";
import type { GuideGameStagePageData } from "@/lib/guides/gameStageGuideTypes";
import type { GuidePossessionPageData } from "@/lib/guides/possessionGuideTypes";
import type { GuideComboPageData, GuideViegoAbilityIcons } from "@/lib/guides/comboGuideTypes";
import type { GuideJungleTierMatchupPageData } from "@/lib/guides/matchupGuideTypes";
import { champSquareUrlById, resolveChampionId } from "@/lib/datadragon/champions";

function addItem(urls: Set<string>, item: SerializedGuideItem | null | undefined) {
  if (item?.icon) urls.add(item.icon);
}

export function collectRuneSectionImageUrls(data: GuideRunePageData): string[] {
  const urls = new Set<string>();

  if (data.headerIcon) urls.add(data.headerIcon.icon);
  urls.add(data.secondaryTree.icon);

  for (const tree of [data.primaryTree, data.secondaryTree]) {
    for (const row of tree.slots) {
      for (const rune of row) {
        urls.add(rune.icon);
      }
    }
  }

  for (const row of data.statShardRows) {
    for (const shard of row.shards) {
      urls.add(shard.icon);
    }
  }

  return [...urls];
}

export function collectItemSectionImageUrls(data: GuideItemPageData): string[] {
  const urls = new Set<string>();

  addItem(urls, data.headerIcon);

  if (data.preBuild) {
    for (const item of data.preBuild.starting) addItem(urls, item);
    addItem(urls, data.preBuild.bootsBase);
    for (const item of data.preBuild.boots) addItem(urls, item);
    addItem(urls, data.preBuild.fullBuild.sell);
    addItem(urls, data.preBuild.fullBuild.buy);
  }

  for (const tab of data.tabs) {
    for (const step of tab.steps) {
      if (step.type === "choice" || step.type === "fixed") {
        for (const item of step.items) addItem(urls, item);
      } else {
        for (const branch of step.branches) {
          for (const item of branch.items) addItem(urls, item);
        }
      }
    }

    if (tab.sharedPath) {
      addItem(urls, tab.sharedPath.origin);
      for (const path of tab.sharedPath.paths) {
        for (const item of path.diverge ?? []) addItem(urls, item);
        for (const item of path.items) addItem(urls, item);
      }
    }

    for (const variant of tab.variants) {
      for (const champion of variant.teamComp.ally) {
        if (champion.icon) urls.add(champion.icon);
      }
      for (const champion of variant.teamComp.enemy) {
        if (champion.icon) urls.add(champion.icon);
      }
      for (const champion of variant.goodAgainst) {
        if (champion.icon) urls.add(champion.icon);
      }
    }
  }

  return [...urls];
}

export function collectMatchupSectionImageUrls(data: GuideMatchupPageData): string[] {
  const urls = new Set<string>();

  for (const column of data.columns) {
    for (const matchup of column.matchups) {
      if (matchup.icon) urls.add(matchup.icon);
    }
  }

  return [...urls];
}

export function collectGameStagesSectionImageUrls(data: GuideGameStagePageData): string[] {
  const urls = new Set<string>();

  for (const category of data.categories) {
    for (const topic of category.topics) {
      if (topic.bannerImageSrc) urls.add(topic.bannerImageSrc);

      for (const video of [...(topic.videos ?? []), ...(topic.videosAfterBody ?? [])]) {
        if (video.posterSrc) urls.add(video.posterSrc);
      }

      for (const entry of topic.invaderList ?? []) {
        if (entry.champion) urls.add(champSquareUrlById(resolveChampionId(entry.champion)));
        for (const champion of entry.champions ?? []) {
          urls.add(champSquareUrlById(resolveChampionId(champion)));
        }
      }
    }
  }

  return [...urls];
}

export function collectPossessionsSectionImageUrls(data: GuidePossessionPageData): string[] {
  const urls = new Set<string>();

  for (const tier of data.possessionTiers) {
    for (const champion of tier.champions) {
      if (champion.icon) urls.add(champion.icon);
      for (const icon of Object.values(champion.abilityIcons)) {
        if (icon) urls.add(icon);
      }
    }
  }

  for (const example of data.howItWorksPassiveExamples ?? []) {
    if (example.passiveIcon) urls.add(example.passiveIcon);
  }

  return [...urls];
}

export function collectCombosSectionImageUrls(
  data: GuideComboPageData,
  abilityIcons: GuideViegoAbilityIcons
): string[] {
  const urls = new Set<string>();

  for (const combo of data.combos) {
    if (combo.posterSrc) urls.add(combo.posterSrc);
    if (combo.ingamePosterSrc) urls.add(combo.ingamePosterSrc);
  }

  for (const icon of Object.values(abilityIcons)) {
    if (icon) urls.add(icon);
  }

  return [...urls];
}

export function collectJungleTierMatchupSectionImageUrls(
  data: GuideJungleTierMatchupPageData
): string[] {
  return data.tiers.flatMap((tier) => tier.matchups.map((matchup) => matchup.icon));
}

export function collectGuideCriticalPreloadUrls(
  runeData: GuideRunePageData,
  championIcon: string
): string[] {
  return [...new Set([championIcon, ...collectRuneSectionImageUrls(runeData)])];
}

export function preloadGuideImages(urls: string[]): Promise<void> {
  if (urls.length === 0) return Promise.resolve();

  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.decoding = "async";
          const finish = () => resolve();
          img.onload = finish;
          img.onerror = finish;
          img.src = url;
        })
    )
  ).then(() => undefined);
}
