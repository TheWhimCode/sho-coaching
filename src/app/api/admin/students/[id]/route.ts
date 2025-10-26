// src/app/api/admin/students/[id]/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ id: string }> };

async function fetchAccountByPuuid(puuid: string) {
  const clusters = ['americas', 'europe', 'asia', 'sea'] as const;

  // Try all clusters, return the first successful one
  for (const c of clusters) {
    const url = `https://${c}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${encodeURIComponent(
      puuid
    )}`;
    const r = await fetch(url, {
      headers: { 'X-Riot-Token': process.env.RIOT_API_KEY ?? '' },
      cache: 'no-store',
    });
    if (r.ok) return r.json() as Promise<{ gameName?: string; tagLine?: string }>;
    // 404 means "not found here", try next cluster; 4xx/5xx others keep trying next
  }
  throw new Error('PUUID not found on any account cluster');
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ student });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({} as any));

  // --- Refresh Riot#Tag via PUUID ---
  if (body?.refresh === true) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!student.puuid) {
      return NextResponse.json({ error: 'No PUUID on record' }, { status: 400 });
    }

    try {
      const acc = await fetchAccountByPuuid(student.puuid);
      const freshTag =
        acc.gameName && acc.tagLine ? `${acc.gameName}#${acc.tagLine}` : null;

      if (!freshTag) {
        return NextResponse.json({ error: 'Empty gameName/tagLine from Riot' }, { status: 502 });
      }

      if ((student.riotTag ?? '') !== freshTag) {
        const updated = await prisma.student.update({
          where: { id },
          data: { riotTag: freshTag },
        });
        return NextResponse.json({ student: updated, changed: true });
      }

      return NextResponse.json({ student, changed: false });
    } catch (e: any) {
      return NextResponse.json({ error: e?.message ?? 'Refresh failed' }, { status: 502 });
    }
  }

  // --- Normal partial update ---
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
