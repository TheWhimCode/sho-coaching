// src/app/api/riot/ranked-matches/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { regionalForServer } from '@/lib/riot';

const RIOT_KEY = process.env.RIOT_API_KEY!;
const headers = { 'X-Riot-Token': RIOT_KEY };

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = String(searchParams.get('studentId') || '');
    const count = Number(searchParams.get('count') || 10);

    if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student?.puuid || !student?.server) {
      return NextResponse.json({ matches: [], reason: 'missing puuid/server' });
    }

    const regional = regionalForServer(student.server);
    // Match-V5 filter for ranked solo queue (420)
    const idsRes = await fetch(
      `https://${regional}.api.riotgames.com/lol/match/v5/matches/by-puuid/${encodeURIComponent(
        student.puuid,
      )}/ids?queue=420&start=0&count=${Math.max(1, Math.min(count, 20))}`,
      { headers, cache: 'no-store' },
    );
    const matchIds: string[] = idsRes.ok ? await idsRes.json() : [];

    const matches = await Promise.all(
      matchIds.map(async (mid) => {
        const r = await fetch(
          `https://${regional}.api.riotgames.com/lol/match/v5/matches/${mid}`,
          { headers, cache: 'no-store' },
        );
        return r.ok ? await r.json() : null;
      }),
    );

    return NextResponse.json({ matches: matches.filter(Boolean) });
  } catch (e: any) {
    console.error('ranked-matches error', e?.message ?? e);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
