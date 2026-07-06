const MEDIA_CDN = "https://videos.its-mino.com";

export const COACHING_CLIP_VIDEO_CDN = `${MEDIA_CDN}/coaching/clips`;
export const COACHING_SQUARE_BUTTON_CDN = `${MEDIA_CDN}/coaching/squarebuttons`;
export const COACHING_SESSION_IMAGE_CDN = `${MEDIA_CDN}/sessions`;
export const COACHING_SESSION_BANNER_CDN = `${MEDIA_CDN}/sessions/banners`;
export const ABOUT_VIDEO_CDN = `${MEDIA_CDN}/about`;
export const CUSTOMIZE_VIDEO_CDN = `${MEDIA_CDN}/customize`;

export const SITE_LOGO = `${MEDIA_CDN}/Logo_blue.png`;export const COACHING_TEXTURE = `${MEDIA_CDN}/coaching/texture.png`;
export const COACHING_TEXTURE3 = `${MEDIA_CDN}/coaching/texture3.jpg`;

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

/** Session card image (filename matches `public/images/sessions/`). */
export function coachingSessionImage(filename: string) {
  return `${COACHING_SESSION_IMAGE_CDN}/${encodeURIComponent(filename)}`;
}

/** Session OG banner (filename matches `public/images/sessions/banner/`). */
export function coachingSessionBanner(filename: string) {
  return `${COACHING_SESSION_BANNER_CDN}/${encodeURIComponent(filename)}`;
}

/** Coaching overview image (e.g. notes.png, Ezreal.png). */
export function coachingOverviewImage(filename: string) {
  return `${MEDIA_CDN}/coaching/overview/${encodeURIComponent(filename)}`;
}

/** About page other-games rank badge. */
export function aboutOtherGameImage(filename: string) {
  return `${MEDIA_CDN}/about/otherGames/${encodeURIComponent(filename)}`;
}

/** League stat icon on Cloudflare (e.g. `league/AS.webp`). */
export function leagueStatIcon(filename: string) {
  return `${MEDIA_CDN}/league/${encodeURIComponent(filename)}`;
}

export const ABOUT_HERO_VIDEO = aboutVideo("ChallPromotionthinner.webm");
export const PARTICLE_BG_VIDEO = customizeVideo("Particle1_slow.webm");
export const PARTICLE_BG_MOBILE_VIDEO = customizeVideo("Particle_mobile480p.webm");
