import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";
import { accountByRiotTag } from "@/lib/riot";
import { leagueEntriesByPuuid, normalizePlatform } from "@/lib/riot/core";

// ✅ ENGINE imports
import {
  computeDayAvailability,
  groupExceptionsByUtcDay,
} from "@/engine/scheduling/availability/getDayAvailability";
import {
  getAllAvailabilityExceptionsInRange,
  getAllAvailabilityRules,
} from "@/engine/scheduling/availability/repository";
import { SLOT_SIZE_MIN } from "@/engine/scheduling/time/timeMath";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Allow rank snapshots to finish for hundreds of students (Vercel Pro+). */
export const maxDuration = 300;

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}

function utcMidnight(d = new Date()) {
  const t = new Date(d);
  t.setUTCHours(0, 0, 0, 0);
  return t;
}

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function cleanupUnpaidBookings() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await prisma.session.deleteMany({
    where: {
      status: "unpaid",
      createdAt: { lt: cutoff },
    },
  });
  return result.count;
}

async function manageSlots() {
  const today = utcMidnight();
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() + 15);
  const now = new Date();

  const delPast = await prisma.slot.deleteMany({
    where: { startTime: { lt: today } },
  });

  const delFuture = await prisma.slot.deleteMany({
    where: {
      startTime: { gte: today },
      status: { in: [SlotStatus.free, SlotStatus.blocked] },
      OR: [{ holdUntil: null }, { holdUntil: { lt: now } }],
    },
  });

  const [allRules, exceptionsInRange] = await Promise.all([
    getAllAvailabilityRules(),
    getAllAvailabilityExceptionsInRange(today, end),
  ]);
  const exceptionsByDay = groupExceptionsByUtcDay(exceptionsInRange);

  let created = 0;

  for (let day = new Date(today); day < end; day.setUTCDate(day.getUTCDate() + 1)) {
    const dayKey = utcMidnight(day).getTime();
    const intervals = computeDayAvailability(
      day,
      allRules,
      exceptionsByDay.get(dayKey) ?? []
    );
    if (!intervals) continue;

    const batch: { startTime: Date; duration: number; status: SlotStatus }[] = [];

    for (const { openMinute, closeMinute } of intervals) {
      for (let m = openMinute; m < closeMinute; m += SLOT_SIZE_MIN) {
        const t = new Date(day);
        t.setUTCMinutes(m, 0, 0);
        batch.push({
          startTime: t,
          duration: SLOT_SIZE_MIN,
          status: SlotStatus.free,
        });
      }
    }

    if (batch.length) {
      const res = await prisma.slot.createMany({
        data: batch,
        skipDuplicates: true,
      });
      created += res.count;
    }
  }

  return { deleted: delPast.count + delFuture.count, created };
}

/* ---------- RANK SNAPSHOTS ---------- */

type RiotRank = { tier: string; division?: string | null; lp: number };

/** Puuid backfill: keep bounded so slot + rank work can run in one invocation. */
const MAX_DURATION_MS = 50_000;

/** ~40/min pacing for Riot account resolution (separate from league entries limiter). */
const PUUID_BACKFILL_INTERVAL_MS = Math.ceil(60_000 / 40);

/** Rank snapshots: separate budget; no fixed per-student sleep (Riot `riotFetch` uses Bottleneck). */
const RANK_SNAPSHOT_BUDGET_MS = 280_000;

/** Call Riot league API directly — avoids HTTP to /api/riot/rank (extra hop + cold starts). */
async function fetchRankFromRiot(server: string, puuid: string): Promise<RiotRank | null> {
  try {
    const { platform } = normalizePlatform(server);
    const entries = await leagueEntriesByPuuid(platform, puuid);
    const solo = Array.isArray(entries)
      ? entries.find((e: { queueType?: string }) => e.queueType === "RANKED_SOLO_5x5")
      : null;
    return {
      tier: solo?.tier ?? "UNRANKED",
      division: solo?.rank ?? null,
      lp: Number(solo?.leaguePoints ?? 0) || 0,
    };
  } catch (e: any) {
    console.warn("cron.daily fetchRankFromRiot error", {
      server,
      puuid: puuid.slice(0, 16) + "...",
      error: String(e?.message || e),
    });
    return null;
  }
}

/** Backfill puuid for students that have riotTag + server but no puuid (e.g. Riot IDs with spaces were not resolved before). */
async function backfillPuuidForStudents() {
  const needPuuid = await prisma.student.findMany({
    where: {
      riotTag: { not: null },
      server: { not: null },
      puuid: null,
    },
    select: { id: true, riotTag: true, server: true },
    orderBy: { createdAt: "asc" },
  });

  let filled = 0;
  const start = Date.now();

  for (const s of needPuuid) {
    if (Date.now() - start > MAX_DURATION_MS) break;
    const riotTag = (s.riotTag ?? "").trim();
    const server = (s.server ?? "").trim();
    if (!riotTag || !server) continue;

    try {
      const acct = await accountByRiotTag(server, riotTag);
      if (acct?.puuid) {
        await prisma.student.update({
          where: { id: s.id },
          data: { puuid: acct.puuid },
        });
        filled++;
      }
    } catch {
      // skip on error (e.g. invalid tag or rate limit)
    }
    await sleep(PUUID_BACKFILL_INTERVAL_MS);
  }

  return { studentsNeedingPuuid: needPuuid.length, puuidsFilled: filled };
}

async function createRankSnapshots() {
  const dayStart = startOfTodayUTC();
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const alreadyToday = await prisma.rankSnapshot.findMany({
    where: {
      capturedAt: { gte: dayStart, lt: dayEnd },
    },
    select: { studentId: true },
  });
  const alreadyIds = new Set(alreadyToday.map((r) => r.studentId));

  const students = await prisma.student.findMany({
    where: {
      puuid: { not: null },
      server: { not: null },
      ...(alreadyIds.size ? { id: { notIn: [...alreadyIds] } } : {}),
    },
    select: { id: true, puuid: true, server: true },
    orderBy: { createdAt: "asc" },
  });

  const capturedAt = new Date();
  const todayUtc = dayStart;
  const start = Date.now();

  const rows: { studentId: string; capturedAt: Date; tier: string; division: string | null; lp: number }[] = [];

  for (const s of students) {
    if (Date.now() - start > RANK_SNAPSHOT_BUDGET_MS) break;

    const rank = await fetchRankFromRiot(s.server!, s.puuid!);
    if (rank) {
      rows.push({
        studentId: s.id,
        capturedAt,
        tier: rank.tier,
        division: rank.division ?? null,
        lp: rank.lp,
      });
    } else {
      console.warn("cron.daily rank snapshot skipped (no rank)", {
        studentId: s.id,
        server: s.server,
        puuid: s.puuid?.slice(0, 16) + "...",
      });
    }
  }

  let inserted = 0;
  if (rows.length) {
    const res = await prisma.rankSnapshot.createMany({
      data: rows,
      skipDuplicates: true,
    });
    inserted = res.count;
  }

  return {
    studentsEligible: students.length + alreadyIds.size,
    skippedAlreadySnapshottedToday: alreadyIds.size,
    studentsScanned: students.length,
    snapshotsAttempted: rows.length,
    snapshotsInserted: inserted,
    dayUTC: todayUtc.toISOString().slice(0, 10),
  };
}

async function runAll() {
  const results = { cleanup: null as any, slots: null as any, puuidBackfill: null as any, ranks: null as any, errors: [] as string[] };

  try {
    results.cleanup = { deleted: await cleanupUnpaidBookings() };
  } catch (e: any) {
    results.errors.push(`cleanup: ${e?.message || e}`);
  }

  try {
    results.slots = await manageSlots();
  } catch (e: any) {
    results.errors.push(`slots: ${e?.message || e}`);
  }

  try {
    results.puuidBackfill = await backfillPuuidForStudents();
  } catch (e: any) {
    results.errors.push(`puuidBackfill: ${e?.message || e}`);
  }

  try {
    results.ranks = await createRankSnapshots();
  } catch (e: any) {
    results.errors.push(`ranks: ${e?.message || e}`);
  }

  return results;
}

export async function GET(req: NextRequest) {
  const fromVercel = !!req.headers.get("x-vercel-cron") || !!req.headers.get("x-vercel-signature");
  const secret = (process.env.CRON_SECRET || "").trim();
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!fromVercel && (!secret || token !== secret)) return unauthorized();

  const result = await runAll();

  console.log("CRON RESULT:", JSON.stringify({ result }));

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
