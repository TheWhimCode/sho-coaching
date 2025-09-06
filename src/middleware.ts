// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CRON_SECRET = process.env.CRON_SECRET;
const IS_PROD = process.env.NODE_ENV === "production";

// constant-time compare (tiny hardening)
function ctEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a[i] ^ b[i];
  return out === 0;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard /admin, /api/admin, and root /coaching
  const isAdmin = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isCoachingRoot = pathname === "/coaching";

  if (!(isAdmin || isAdminApi || isCoachingRoot)) {
    return NextResponse.next();
  }

  // Enforce HTTPS only in production (avoid localhost SSL errors)
  if (IS_PROD) {
    const proto = req.headers.get("x-forwarded-proto");
    if (proto && proto !== "https") {
      const httpsURL = new URL(req.nextUrl);
      httpsURL.protocol = "https:";
      return NextResponse.redirect(httpsURL);
    }
  }

  // Allow login/logout/auth endpoints to pass through
  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/api/admin/auth")
  ) {
    return NextResponse.next();
  }

  // Protect cron with Bearer secret
  if (pathname.startsWith("/api/admin/slots/cron")) {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    const enc = new TextEncoder();
    const ok =
      CRON_SECRET &&
      ctEqual(enc.encode(token), enc.encode(CRON_SECRET));
    if (!ok) return new NextResponse("Unauthorized", { status: 401 });
    return NextResponse.next();
  }

  // Cookie-based admin auth (set by /api/admin/auth/login)
  const authed = req.cookies.get("admin_auth")?.value === "1";
  if (authed) return NextResponse.next();

  // If API → 401 JSON; if UI → redirect to login
  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/coaching"],
};
