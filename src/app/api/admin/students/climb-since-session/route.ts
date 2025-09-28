import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/climb-since-session?studentId=...&sessionId=...(optional)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const sessionId = searchParams.get('sessionId'); // optional

  if (!studentId) {
    return NextResponse.json({ error: 'studentId required' }, { status: 400 });
  }

  // fetch snapshots (daily series)
  const rows = await prisma.rankSnapshot.findMany({
    where: { studentId },
    orderBy: { capturedAt: 'asc' },
    select: { capturedAt: true, tier: true, division: true, lp: true },
  });

  // base payload for graphs that need the raw series
  const series = rows.map(r => ({
    date: r.capturedAt.toISOString().slice(0, 10),
    tier: r.tier,
    division: r.division,
    lp: r.lp,
  }));

  // if sessionId provided, also compute "climbed since session" (LP delta)
  if (sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { scheduledStart: true, studentId: true },
    });
    if (!session || session.studentId !== studentId) {
      return NextResponse.json({ error: 'session not found for student' }, { status: 404 });
    }

    // find the first snapshot at/after session start (baseline)
    const baseline = rows.find(r => r.capturedAt >= session.scheduledStart) ?? rows[0];
    if (!baseline) {
      return NextResponse.json({ series, climbed: [] }); // no snapshots yet
    }

    // simple rank→points (same scale used in the component)
    const TIER_ORDER = ['IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'];
    const DIV_ORDER = ['IV','III','II','I'];
    const rankToPoints = (tier: string, division: string | null | undefined, lp: number) => {
      const t = (tier ?? '').toUpperCase();
      const d = (division ?? 'IV').toUpperCase();
      const ti = Math.max(0, TIER_ORDER.indexOf(t));
      const base = ti * 400;
      if (t === 'MASTER' || t === 'GRANDMASTER' || t === 'CHALLENGER') return base + Math.max(0, lp);
      const di = DIV_ORDER.indexOf(d);
      const divOffset = (DIV_ORDER.length - 1 - Math.max(0, di)) * 100;
      return base + divOffset + Math.max(0, lp);
    };

    const basePts = rankToPoints(baseline.tier, baseline.division, baseline.lp);
    const climbed = rows
      .filter(r => r.capturedAt >= session.scheduledStart)
      .map(r => ({
        date: r.capturedAt.toISOString().slice(0, 10),
        climbed: rankToPoints(r.tier, r.division, r.lp) - basePts,
      }));

    return NextResponse.json({ series, climbed });
  }

  // default: just the daily series
  return NextResponse.json(series);
}
