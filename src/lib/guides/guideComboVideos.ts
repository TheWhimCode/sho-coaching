export const GUIDE_COMBO_VIDEO_CDN = "https://videos.its-mino.com/guide/combo";
export const GUIDE_COMBO_THUMBNAIL_CDN = "https://videos.its-mino.com/guide/comboThumbnails";

/** Combo clip hosted on Cloudflare R2 under `guide/combo/`. */
export function guideComboVideo(filename: string) {
  return `${GUIDE_COMBO_VIDEO_CDN}/${encodeURIComponent(filename)}`;
}

/** Combo poster hosted on Cloudflare R2 under `guide/comboThumbnails/`. */
export function guideComboThumbnail(filename: string) {
  return `${GUIDE_COMBO_THUMBNAIL_CDN}/${encodeURIComponent(filename)}`;
}
