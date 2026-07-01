export const GUIDE_COMBO_VIDEO_CDN = "https://videos.its-mino.com";

/** Combo clip hosted on Cloudflare (filename matches `public/videos/guide/`). */
export function guideComboVideo(filename: string) {
  return `${GUIDE_COMBO_VIDEO_CDN}/${encodeURIComponent(filename)}`;
}
