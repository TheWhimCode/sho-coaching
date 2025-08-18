// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECT = [/^\/admin($|\/)/, /^\/api\/admin\//];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECT.some((re) => re.test(pathname));
  if (!needsAuth) return NextResponse.next();

  const auth = req.headers.get("authorization") || "";
  const user = process.env.ADMIN_USER || "admin";
  const pass = process.env.ADMIN_PASS || "change-me";

  if (!auth.startsWith("Basic ")) {
    return new NextResponse("Auth required", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
    });
  }

  const [, b64] = auth.split(" ");
  const [u, p] = Buffer.from(b64, "base64").toString("utf8").split(":");
  if (u !== user || p !== pass) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
