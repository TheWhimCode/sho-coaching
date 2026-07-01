const VIEGO_CLIPS_CDN = "https://videos.its-mino.com/viego-clips";

export const COACHING_CLIP_VIDEO_CDN = `${VIEGO_CLIPS_CDN}/coaching/clips`;
export const ABOUT_VIDEO_CDN = `${VIEGO_CLIPS_CDN}/about`;
export const COACHING_SQUARE_BUTTON_CDN = "https://videos.its-mino.com/coaching/squarebuttons";

/** Clip at the root of `viego-clips/` on Cloudflare. */
export function viegoClipVideo(filename: string) {
  return `${VIEGO_CLIPS_CDN}/${encodeURIComponent(filename)}`;
}

/** Coaching clip hosted on Cloudflare (filename matches `public/videos/coaching/clips/`). */
export function coachingClipVideo(filename: string) {
  return `${COACHING_CLIP_VIDEO_CDN}/${encodeURIComponent(filename)}`;
}

/** About page clip hosted on Cloudflare (filename matches `public/videos/about/`). */
export function aboutVideo(filename: string) {
  return `${ABOUT_VIDEO_CDN}/${encodeURIComponent(filename)}`;
}

/** Coaching square button image (filename matches `public/images/squarebuttons/`). */
export function coachingSquareButtonImage(filename: string) {
  return `${COACHING_SQUARE_BUTTON_CDN}/${encodeURIComponent(filename)}`;
}

export const ABOUT_HERO_VIDEO = aboutVideo("ChallPromotionthinner.webm");
export const PARTICLE_BG_VIDEO = viegoClipVideo("Particle1_slow.webm");
export const PARTICLE_BG_MOBILE_VIDEO = viegoClipVideo("Particle_mobile480p.webm");
