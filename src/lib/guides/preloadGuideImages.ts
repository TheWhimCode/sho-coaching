import type { GuideItemPageData, SerializedGuideItem } from "@/lib/guides/itemGuideTypes";
import type { GuideMatchupPageData } from "@/lib/guides/matchupGuideTypes";
import type { GuideRunePageData } from "@/lib/guides/runeGuideTypes";

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
