import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/admin/session';
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, '', { path: '/', httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 0 });
  return res;
}
