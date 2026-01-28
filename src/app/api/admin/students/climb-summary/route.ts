// app/api/admin/students/climb-summary/route.ts
// GET /api/admin/students/climb-summary?studentId=...

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// --- shared rank math (keep identical to client/server) ---
const TIER_ORDER = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
] as const;
const DIV_ORDER = ["IV", "III", "II", "I"] as const;
const MASTER_BASE = TIER_ORDER.indexOf("MASTER") * 400; // 2800

// Return null for UNRANKED/unknown tiers so they don't distort deltas.
function rankToPoints(
  tier: string,
  division: string | null | undefined,
  lp: number
): number | null {
  const t = (tier ?? "").toUpperCase();

  if (!t || t === "UNRANKED") return null;

  if (t === "MASTER" || t === "GRANDMASTER" || t === "CHALLENGER") {
    return MASTER_BASE + Math.max(0, lp);
  }

  const ti = TIER_ORDER.indexOf(t as any);
  if (ti < 0) return null;

  const d = (division ?? "IV").toUpperCase();
  const di = Math.max(0, DIV_ORDER.indexOf(d as any)); // 0=IV, 3=I

  return ti * 400 + di * 100 + Math.max(0, lp);
}

type ClimbSummary = {
  fromSessionStart: string;
  baselineDateTime: string;
  baselinePoints: number;
  latestDateTime: string;
  latestPoints: number;
  deltaToLatest: number;
  latestRank: {
    tier: string;
    division: string | null;
    lp: number;
  };
} | null;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 });
  }

  // 1) First session (baseline is "before this session")
  const firstSession = await prisma.session.findFirst({
    where: { studentId },
    orderBy: { scheduledStart: "asc" },
    select: { scheduledStart: true },
  });

  if (!firstSession) {
    const overall: ClimbSummary = null;
    return NextResponse.json({ overall });
  }

  // 2) Baseline snapshot: last snapshot BEFORE first session
  let baselineSnap = await prisma.rankSnapshot.findFirst({
    where: {
      studentId,
      capturedAt: { lt: firstSession.scheduledStart },
    },
    orderBy: { capturedAt: "desc" },
  });

  // Fallback: if none exist before, use the FIRST snapshot ON/AFTER the first session.
  if (!baselineSnap) {
    baselineSnap = await prisma.rankSnapshot.findFirst({
      where: {
        studentId,
        capturedAt: { gte: firstSession.scheduledStart },
      },
      orderBy: { capturedAt: "asc" },
    });
  }

  // 3) Latest snapshot: most recent overall
  const latestSnap = await prisma.rankSnapshot.findFirst({
    where: { studentId },
    orderBy: { capturedAt: "desc" },
  });

  if (!baselineSnap || !latestSnap) {
    const overall: ClimbSummary = null;
    return NextResponse.json({ overall });
  }

  // Convert ranks -> points. If UNRANKED/unknown, points will be null.
  const baselinePoints = rankToPoints(
    baselineSnap.tier,
    baselineSnap.division,
    baselineSnap.lp
  );
  const latestPoints = rankToPoints(
    latestSnap.tier,
    latestSnap.division,
    latestSnap.lp
  );

  // If either side is UNRANKED/invalid, don't emit an overall delta.
  if (baselinePoints == null || latestPoints == null) {
    const overall: ClimbSummary = null;
    return NextResponse.json({ overall });
  }

  const overall: ClimbSummary = {
    fromSessionStart: firstSession.scheduledStart.toISOString(),
    baselineDateTime: baselineSnap.capturedAt.toISOString(),
    baselinePoints,
    latestDateTime: latestSnap.capturedAt.toISOString(),
    latestPoints,
    deltaToLatest: latestPoints - baselinePoints,
    latestRank: {
      tier: latestSnap.tier,
      division: latestSnap.division,
      lp: latestSnap.lp,
    },
  };

  return NextResponse.json({ overall });
}
