export const GUIDE_COMBO_VIDEO_CDN = "https://videos.its-mino.com/guide/combo";

/** Combo clip hosted on Cloudflare R2 under `guide/combo/`. */
export function guideComboVideo(filename: string) {
  return `${GUIDE_COMBO_VIDEO_CDN}/${encodeURIComponent(filename)}`;
}
