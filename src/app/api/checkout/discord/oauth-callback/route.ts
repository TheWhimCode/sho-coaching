// app/api/checkout/discord/oauth-callback/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;

function htmlCloseWithMessage(origin: string, type: string, payload?: unknown) {
  const json = JSON.stringify({ type, ...(payload ? { ...(payload as any) } : {}) });
  return `<!doctype html><meta charset="utf-8" />
<script>
 (function(){
   try {
     if (window.opener) {
       window.opener.postMessage(${JSON.stringify(json)}, ${JSON.stringify(origin)});
     }
   } catch(e) {}
   window.close();
 })();
</script>`;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = url.origin; // <-- preview/prod/local host used in start route
  const REDIRECT_URI = `${origin}/api/checkout/discord/oauth-callback`; // <-- must match start + Discord

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get("dc_oauth_state")?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return new NextResponse(htmlCloseWithMessage(origin, "discord-auth-cancel", { error: "state_mismatch" }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    return new NextResponse(htmlCloseWithMessage(origin, "discord-auth-cancel", { error: "not_configured" }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI, // <-- EXACT match to authorize step
      }),
    });

    if (!tokenRes.ok) {
      return new NextResponse(htmlCloseWithMessage(origin, "discord-auth-cancel", { error: "token_failed" }), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const token = await tokenRes.json();
    const access = token.access_token as string | undefined;
    if (!access) {
      return new NextResponse(htmlCloseWithMessage(origin, "discord-auth-cancel", { error: "no_access_token" }), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const meRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    if (!meRes.ok) {
      return new NextResponse(htmlCloseWithMessage(origin, "discord-auth-cancel", { error: "user_failed" }), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const me = await meRes.json();
    const user = {
      id: String(me.id),
      username: me.username ?? null,
      globalName: me.global_name ?? null,
      avatar: me.avatar ?? null,
    };

    return new NextResponse(htmlCloseWithMessage(origin, "discord-auth-success", { user }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch {
    return new NextResponse(htmlCloseWithMessage(origin, "discord-auth-cancel", { error: "exception" }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
