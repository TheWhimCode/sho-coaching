import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, createAdminSession, validAdminPassword } from "@/lib/admin/session";
import { enforceRequestLimit, RequestLimitError, visitorBucket } from "@/lib/security/requestLimit";
import { readLimitedText } from "@/lib/security/requestBody";

export async function POST(req: Request) {
  try {
    await enforceRequestLimit("admin-login:global", 100, 60_000);
    await enforceRequestLimit(`admin-login:ip:${visitorBucket(req.headers)}`, 10, 60_000);
    const body = await readLimitedText(req, 2048);
    let password: unknown;
    try { password = JSON.parse(body)?.password; } catch { /* Invalid JSON is rejected below. */ }
    if (!validAdminPassword(password)) return NextResponse.json({ ok: false }, { status: 401 });
    const res = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    res.cookies.set(ADMIN_COOKIE, createAdminSession(), {
      path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production",
      sameSite: "strict", maxAge: ADMIN_SESSION_SECONDS,
    });
    return res;
  } catch (error) {
    if (error instanceof RangeError) return NextResponse.json({ ok: false }, { status: 413 });
    if (error instanceof RequestLimitError) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(error.retryAfter), "Cache-Control": "no-store" } });
    console.error("[admin-login] request guard unavailable");
    return NextResponse.json({ ok: false, error: "Login temporarily unavailable" }, { status: 503 });
  }
}
