// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/admin/session";
import { enforceRequestLimit, RequestLimitError, visitorBucket } from "@/lib/security/requestLimit";

const CRON_SECRET = process.env.CRON_SECRET;
const IS_PROD = process.env.NODE_ENV === "production";

function ctEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a[i] ^ b[i];
  return out === 0;
}

function withNoIndex(response: NextResponse) {
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdmin = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (pathname.startsWith("/api/riot/")) {
    try {
      await enforceRequestLimit("public-riot:global", 600, 60_000);
      await enforceRequestLimit(`public-riot:ip:${visitorBucket(req.headers)}`, 20, 60_000);
      return NextResponse.next();
    } catch (error) {
      const limited = error instanceof RequestLimitError;
      return NextResponse.json({ error: limited ? "rate_limited" : "temporarily_unavailable" }, {
        status: limited ? 429 : 503,
        headers: { "Cache-Control": "no-store", ...(limited ? { "Retry-After": String(error.retryAfter) } : {}) },
      });
    }
  }

  // if not admin stuff → skip proxy
  if (!(isAdmin || isAdminApi)) return NextResponse.next();

  if (IS_PROD) {
    const proto = req.headers.get("x-forwarded-proto");
    if (proto && proto !== "https") {
      const httpsURL = new URL(req.nextUrl);
      httpsURL.protocol = "https:";
      return NextResponse.redirect(httpsURL);
    }
  }

  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    const origin = req.headers.get("origin");
    if (origin && origin !== req.nextUrl.origin) {
      return withNoIndex(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
    }
  }

  if (
    pathname === "/admin/login" ||
    pathname === "/api/admin/auth/login" || pathname === "/api/admin/auth/logout"
  ) {
    return withNoIndex(NextResponse.next());
  }

  if (pathname === "/api/admin/slots/cron") {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const enc = new TextEncoder();
    const ok = CRON_SECRET && ctEqual(enc.encode(token), enc.encode(CRON_SECRET));
    if (!ok) return new NextResponse("Unauthorized", { status: 401 });
    return NextResponse.next();
  }

  const authed = verifyAdminSession(req.cookies.get(ADMIN_COOKIE)?.value);
  if (authed) return withNoIndex(NextResponse.next());

  if (pathname.startsWith("/api")) {
    return withNoIndex(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return withNoIndex(NextResponse.redirect(url));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/riot/:path*"],
};
