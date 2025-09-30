import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
const REDIRECT_URI = `${SITE_URL}/api/discord/oauth/callback`;

function htmlCloseWithMessage(type: string, payload?: unknown) {
  const origin = SITE_URL;
  const json = JSON.stringify({ type, ...(payload ? { ...payload as any } : {}) });
  return `
<!doctype html>
<meta charset="utf-8" />
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
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get("dc_oauth_state")?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return new NextResponse(htmlCloseWithMessage("discord-auth-cancel", { error: "state_mismatch" }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !SITE_URL) {
    return new NextResponse(htmlCloseWithMessage("discord-auth-cancel", { error: "not_configured" }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      return new NextResponse(htmlCloseWithMessage("discord-auth-cancel", { error: "token_failed" }), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const token = await tokenRes.json();
    const access = token.access_token as string | undefined;
    if (!access) {
      return new NextResponse(htmlCloseWithMessage("discord-auth-cancel", { error: "no_access_token" }), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Fetch user
    const meRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access}` },
      cache: "no-store",
    });

    if (!meRes.ok) {
      return new NextResponse(htmlCloseWithMessage("discord-auth-cancel", { error: "user_failed" }), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const me = await meRes.json();
    // Minimal payload you use in StepContact
    const user = {
      id: String(me.id),
      username: me.username ?? null,
      globalName: me.global_name ?? null,
      avatar: me.avatar ?? null,
    };

    // Success → postMessage back to opener and close
    return new NextResponse(
      htmlCloseWithMessage("discord-auth-success", { user }),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (e) {
    return new NextResponse(htmlCloseWithMessage("discord-auth-cancel", { error: "exception" }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
