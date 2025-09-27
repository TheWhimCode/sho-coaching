// src/app/api/cron/rank-snapshots/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

type RiotRank = { tier: string; division?: string | null; lp: number };

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function fetchRank(origin: string, server: string, puuid: string): Promise<RiotRank | null> {
  const url = `${origin}/api/riot/rank?server=${encodeURIComponent(server)}&puuid=${encodeURIComponent(puuid)}`;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) return null;
  const j = await r.json().catch(() => ({}));
  return {
    tier: j?.tier ?? j?.data?.tier ?? 'UNRANKED',
    division: j?.division ?? j?.data?.division ?? null,
    lp: Number(j?.lp ?? j?.leaguePoints ?? 0) || 0,
  };
}

export async function POST(req: NextRequest) {
  // === AUTH ===
  const auth = (req.headers.get('authorization') || '').trim();
  const fromVercelCron = !!req.headers.get('x-vercel-cron');
  const secret = (process.env.CRON_SECRET || '').trim();
  const token = auth.replace(/^Bearer\s+/i, '').trim();

  if (!fromVercelCron && (!secret || token !== secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // === ORIGIN ===
  const origin = req.nextUrl.origin;

  // === STUDENTS ===
  const students = await prisma.student.findMany({
    where: { puuid: { not: null }, server: { not: null } },
    select: { id: true, puuid: true, server: true },
  });

  const todayUtc = startOfTodayUTC();
  const capturedAt = new Date();

  // === FETCH RANKS CONCURRENTLY ===
  const concurrency = 6;
  let index = 0;
  const rows: { studentId: string; capturedAt: Date; tier: string; division: string | null; lp: number }[] = [];

  const workers = Array.from({ length: concurrency }, () =>
    (async () => {
      while (index < students.length) {
        const i = index++;
        const s = students[i];
        if (!s.server || !s.puuid) continue;

        const rank = await fetchRank(origin, s.server, s.puuid).catch(() => null);
        if (!rank) continue;

        rows.push({
          studentId: s.id,
          capturedAt,
          tier: rank.tier,
          division: rank.division ?? null,
          lp: rank.lp,
        });
      }
    })()
  );

  await Promise.all(workers);

  // === INSERT SNAPSHOTS ===
  let inserted = 0;
  if (rows.length) {
    const res = await prisma.rankSnapshot.createMany({
      data: rows,
      skipDuplicates: true, // relies on your unique index if present
    });
    inserted = res.count;
  }

  return NextResponse.json({
    studentsScanned: students.length,
    snapshotsAttempted: rows.length,
    snapshotsInserted: inserted,
    dayUTC: todayUtc.toISOString().slice(0, 10),
  });
}

// === TEMPORARY DEBUG ENDPOINT ===
function h(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export async function GET(req: NextRequest) {
  const auth = (req.headers.get('authorization') || '').trim();
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  const secret = (process.env.CRON_SECRET || '').trim();

  return NextResponse.json({
    hasSecret: Boolean(secret),
    tokenPresent: Boolean(token),
    secretLen: secret.length,
    tokenLen: token.length,
    secretSha256: secret ? h(secret) : null,
    tokenSha256: token ? h(token) : null,
    equal: secret && token ? h(secret) === h(token) : false,
    vercelCronHeader: !!req.headers.get('x-vercel-cron'),
  });
}
