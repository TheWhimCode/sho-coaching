import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;

export async function GET(req: NextRequest) {
  if (!DISCORD_CLIENT_ID) {
    return NextResponse.json({ error: "discord_not_configured" }, { status: 500 });
  }

  // Build redirect URI from the current request origin so it works on previews
  const origin = new URL(req.url).origin;
  const REDIRECT_URI = `${origin}/api/checkout/discord/oauth-callback`;

  const state = crypto.randomUUID();

  const authUrl = new URL("https://discord.com/oauth2/authorize");
  authUrl.searchParams.set("client_id", DISCORD_CLIENT_ID);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "identify");
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "consent");

  const res = NextResponse.redirect(authUrl.toString(), { status: 302 });
  const isSecure = origin.startsWith("https://");

  res.cookies.set("dc_oauth_state", state, {
    httpOnly: true,
    secure: isSecure, // true on Vercel/previews, false on http://localhost
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return res;
}
