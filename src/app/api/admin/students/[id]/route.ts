// src/app/api/admin/students/[id]/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ student });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({} as any));

  const data: Record<string, unknown> = {};
  if ('name' in body) data.name = body.name;
  if ('discordId' in body) data.discordId = body.discordId ?? null;
  if ('discordName' in body) data.discordName = body.discordName ?? null;
  if ('riotTag' in body) data.riotTag = body.riotTag ?? null;
  if ('server' in body) data.server = body.server ?? null;
  if ('puuid' in body) data.puuid = body.puuid ?? null;

  try {
    const student = await prisma.student.update({ where: { id }, data });
    return NextResponse.json({ student });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
