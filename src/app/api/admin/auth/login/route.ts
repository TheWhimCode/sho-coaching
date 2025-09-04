import { NextResponse } from 'next/server';

export async function POST(req: Request) {
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
