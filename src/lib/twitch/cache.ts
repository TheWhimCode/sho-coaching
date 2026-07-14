/** Shared TTL for Twitch live status (CDN, browser, and server fetch cache). */
export const TWITCH_STATUS_CACHE_SECONDS = 600;

const TWITCH_STATUS_SESSION_KEY = "mino:twitch-live-status";

type TwitchStatusSessionEntry = {
  status: { isLive: boolean; title?: string; viewerCount?: number; thumbnailUrl?: string };
  cachedAt: number;
};

export function readTwitchStatusSessionCache(): TwitchStatusSessionEntry | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(TWITCH_STATUS_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as TwitchStatusSessionEntry;
    if (!parsed?.status || typeof parsed.cachedAt !== "number") return null;
    if (Date.now() - parsed.cachedAt > TWITCH_STATUS_CACHE_SECONDS * 1000) return null;

    return parsed;
  } catch {
    return null;
  }
}

export function writeTwitchStatusSessionCache(
  status: TwitchStatusSessionEntry["status"]
): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(
      TWITCH_STATUS_SESSION_KEY,
      JSON.stringify({ status, cachedAt: Date.now() } satisfies TwitchStatusSessionEntry)
    );
  } catch {
    // Ignore quota or privacy mode errors.
  }
}

/** Client poll interval while live, section visible, and tab focused. */
export const TWITCH_LIVE_POLL_MS = TWITCH_STATUS_CACHE_SECONDS * 1000;
