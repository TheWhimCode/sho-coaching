import type { GuideRunePageData } from "@/lib/guides/runeGuideTypes";

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
