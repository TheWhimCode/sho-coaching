// /api/climb-since-session?studentId=...
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Stable points mapping (tiers/divs baked into a single scale)
const TIER_ORDER = ['IRON','BRONZE','SILVER','GOLD','PLATINUM','EMERALD','DIAMOND','MASTER','GRANDMASTER','CHALLENGER'] as const;
const DIV_ORDER  = ['IV','III','II','I'] as const;
const MASTER_BASE = TIER_ORDER.indexOf('MASTER') * 400; // 2800
function rankToPoints(tier: string, division: string | null | undefined, lp: number) {
  const t = (tier ?? '').toUpperCase();
  if (t === 'MASTER' || t === 'GRANDMASTER' || t === 'CHALLENGER') return MASTER_BASE + Math.max(0, lp);
  const d  = (division ?? 'IV').toUpperCase();
  const ti = Math.max(0, TIER_ORDER.indexOf(t as any));
  const di = Math.max(0, DIV_ORDER.indexOf(d as any));
  return ti * 400 + (DIV_ORDER.length - 1 - di) * 100 + Math.max(0, lp);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });

  // 1) Load snapshots & sessions
  const [snapshots, sessions] = await Promise.all([
    prisma.rankSnapshot.findMany({
      where: { studentId },
      orderBy: { capturedAt: 'asc' },
      select: { capturedAt: true, tier: true, division: true, lp: true },
    }),
    prisma.session.findMany({
      where: { studentId },
      orderBy: [{ scheduledStart: 'asc' }, { id: 'asc' }], // deterministic if same start
      select: { id: true, scheduledStart: true },
    }),
  ]);

  // Build chart series with points
  const series = snapshots.map(r => {
    const iso = r.capturedAt.toISOString();
    return {
      date: iso.slice(0, 10),   // for XAxis ticks/labels
      dateTime: iso,            // full precision for comparisons
      tier: r.tier,
      division: r.division,
      lp: r.lp,
      points: rankToPoints(r.tier, r.division, r.lp),
    };
  });

  const sessionsPayload = sessions.map(s => ({
    id: s.id,
    scheduledStart: s.scheduledStart.toISOString(),
    day: s.scheduledStart.toISOString().slice(0, 10),
  }));

  if (series.length === 0 || sessions.length === 0) {
    return NextResponse.json({
      series,
      sessions: sessionsPayload,
      climbsBySession: [],
      overall: null,
    });
  }

  // Binary-search helpers over sorted series
  // last index STRICTLY BEFORE target datetime (baseline you asked for)
  function lastIdxBefore(isoDateTime: string): number {
    let lo = 0, hi = series.length - 1, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (series[mid].dateTime < isoDateTime) { ans = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    return ans; // -1 => nothing before
  }

  // Also handy: last series index
  const lastIdx = series.length - 1;
  const lastSnap = series[lastIdx];

  type Climb = {
    sessionId: string;
    sessionStart: string;
    baselineDateTime?: string;
    baselinePoints?: number;
    windowEndDateTime?: string;
    windowEndPoints?: number;
    deltaWindow?: number;     // snapshotBefore(nextSession) - snapshotBefore(session)
    latestDateTime?: string;
    latestPoints?: number;
    deltaToLatest?: number;   // latest - baseline
  };

  const climbsBySession: Climb[] = [];

  for (let i = 0; i < sessions.length; i++) {
    const cur = sessions[i];
    const next = sessions[i + 1] ?? null;

    const startISO = cur.scheduledStart.toISOString();

    // Baseline = snapshot right BEFORE the session start
    const baselineIdx = lastIdxBefore(startISO);
    if (baselineIdx === -1) {
      // No snapshot before this session -> cannot compute baseline as requested
      // We return a stub entry so the client can render the marker but no deltas.
      climbsBySession.push({
        sessionId: cur.id,
        sessionStart: startISO,
      });
      continue;
    }
    const baseline = series[baselineIdx];

    // Window end = snapshot right BEFORE the next session (or latest if no next)
    const windowEndIdx = next
      ? Math.max(baselineIdx, lastIdxBefore(next.scheduledStart.toISOString()))
      : lastIdx;
    const windowEnd = series[windowEndIdx];

    // To-latest uses the last snapshot available
    const latest = lastSnap;

    climbsBySession.push({
      sessionId: cur.id,
      sessionStart: startISO,
      baselineDateTime: baseline.dateTime,
      baselinePoints: baseline.points,
      windowEndDateTime: windowEnd.dateTime,
      windowEndPoints: windowEnd.points,
      deltaWindow: windowEnd.points - baseline.points,
      latestDateTime: latest.dateTime,
      latestPoints: latest.points,
      deltaToLatest: latest.points - baseline.points,
    });
  }

  // Overall: from snapshot BEFORE the FIRST session → latest snapshot
  const firstSessionISO = sessions[0].scheduledStart.toISOString();
  const overallBaselineIdx = lastIdxBefore(firstSessionISO);
  const overall =
    overallBaselineIdx !== -1
      ? {
          fromSessionStart: firstSessionISO,
          baselineDateTime: series[overallBaselineIdx].dateTime,
          baselinePoints: series[overallBaselineIdx].points,
          latestDateTime: lastSnap.dateTime,
          latestPoints: lastSnap.points,
          deltaToLatest: lastSnap.points - series[overallBaselineIdx].points,
        }
      : null;

  return NextResponse.json({
    series,             // snapshots with points for graphing
    sessions: sessionsPayload,
    climbsBySession,    // per session: windowed & to-latest
    overall,            // since first session (baseline = snap before first session)
  });
}
