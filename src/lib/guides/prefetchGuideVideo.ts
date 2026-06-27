const prefetchedVideos = new Set<string>();

/** Warm the browser cache for a guide video without mounting a player. */
export function prefetchGuideVideo(src: string) {
  if (typeof window === "undefined" || prefetchedVideos.has(src)) return;
  prefetchedVideos.add(src);

  const link = document.createElement("link");
  link.rel = "prefetch";
  link.as = "video";
  link.href = src;
  document.head.appendChild(link);
}

export function prefetchGuideComboVideos(combo: {
  videoSrc?: string | null;
  ingameExampleVideoSrc?: string | null;
}) {
  if (combo.videoSrc) prefetchGuideVideo(combo.videoSrc);
  if (combo.ingameExampleVideoSrc) prefetchGuideVideo(combo.ingameExampleVideoSrc);
}
