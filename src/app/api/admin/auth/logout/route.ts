import { NextResponse } from 'next/server';
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.append('Set-Cookie', `admin_auth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  return res;
}
