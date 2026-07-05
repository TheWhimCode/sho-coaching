/** Vimeo player iframe src for a video ID (from vimeo.com/123456789). */
export function guideVimeoEmbed(videoId: string) {
  const params = new URLSearchParams({
    badge: "0",
    autopause: "0",
    controls: "0",
    title: "0",
    byline: "0",
    portrait: "0",
    pip: "0",
    dnt: "1",
  });
  return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
}

/** Parse a Vimeo page or player URL down to the numeric video ID. */
export function parseVimeoVideoId(input: string): string | null {
  const match = input.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match?.[1] ?? null;
}
