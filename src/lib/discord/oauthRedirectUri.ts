import type { NextRequest } from "next/server";
import { SITE_URL } from "@/lib/site";

const CALLBACK_PATH = "/api/checkout/discord/oauth-callback";

/** Redirect URI sent to Discord — must exactly match a URL in the Discord app OAuth2 settings. */
export function discordOAuthRedirectUri(req: NextRequest): string {
  const explicit = process.env.DISCORD_OAUTH_REDIRECT_URI?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const { origin, hostname } = new URL(req.url);

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${origin}${CALLBACK_PATH}`;
  }

  // Vercel preview URLs are unique per deployment.
  if (hostname.endsWith(".vercel.app")) {
    return `${origin}${CALLBACK_PATH}`;
  }

  // Custom domain — canonical origin avoids www / apex mismatches vs Discord portal.
  return `${SITE_URL}${CALLBACK_PATH}`;
}
