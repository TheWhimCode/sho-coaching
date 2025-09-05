import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(req: Request) {
  // derive IP (fallback to unknown)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`admin:login:${ip}`, 10, 60_000)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const { password } = await req.json().catch(() => ({}));
  if (!password) return NextResponse.json({ ok: false }, { status: 400 });

  if (password !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.headers.append(
    'Set-Cookie',
    `admin_auth=1; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 8}` // 8h
  );
  return res;
}
