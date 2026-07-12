import "server-only";

import { TWITCH_STATUS_CACHE_SECONDS } from "./cache";
import { TWITCH_CHANNEL_LOGIN } from "./channel";
import type { TwitchStreamStatus } from "./types";

type TokenCache = {
  token: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

async function getAppAccessToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token || !data.expires_in) return null;

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.token;
}

function formatThumbnailUrl(template: string) {
  return template.replace("{width}", "640").replace("{height}", "360");
}

export async function fetchTwitchStreamStatus(
  login: string = TWITCH_CHANNEL_LOGIN
): Promise<TwitchStreamStatus> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const token = await getAppAccessToken();
  if (!clientId || !token) return { isLive: false };

  const res = await fetch(
    `https://api.twitch.tv/helix/streams?user_login=${encodeURIComponent(login)}`,
    {
      headers: {
        "Client-Id": clientId,
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: TWITCH_STATUS_CACHE_SECONDS },
    }
  );

  if (!res.ok) return { isLive: false };

  const data = (await res.json()) as {
    data?: Array<{
      title?: string;
      viewer_count?: number;
      thumbnail_url?: string;
    }>;
  };

  const stream = data.data?.[0];
  if (!stream) return { isLive: false };

  return {
    isLive: true,
    title: stream.title,
    viewerCount: stream.viewer_count,
    thumbnailUrl: stream.thumbnail_url
      ? formatThumbnailUrl(stream.thumbnail_url)
      : undefined,
  };
}
