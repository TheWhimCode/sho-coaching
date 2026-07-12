/** Shared TTL for Twitch live status (CDN, browser, and server fetch cache). */
export const TWITCH_STATUS_CACHE_SECONDS = 300;

/** Client poll interval while live, section visible, and tab focused. */
export const TWITCH_LIVE_POLL_MS = TWITCH_STATUS_CACHE_SECONDS * 1000;
