const MEDIA_CDN = "https://videos.its-mino.com";

export const COACHING_CLIP_VIDEO_CDN = `${MEDIA_CDN}/coaching/clips`;
export const COACHING_SQUARE_BUTTON_CDN = `${MEDIA_CDN}/coaching/squarebuttons`;
export const ABOUT_VIDEO_CDN = `${MEDIA_CDN}/about`;
export const CUSTOMIZE_VIDEO_CDN = `${MEDIA_CDN}/customize`;

/** Particle / customize clips on Cloudflare (filename matches `public/videos/customize/`). */
export function customizeVideo(filename: string) {
  return `${CUSTOMIZE_VIDEO_CDN}/${encodeURIComponent(filename)}`;
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
export const PARTICLE_BG_VIDEO = customizeVideo("Particle1_slow.webm");
export const PARTICLE_BG_MOBILE_VIDEO = customizeVideo("Particle_mobile480p.webm");
