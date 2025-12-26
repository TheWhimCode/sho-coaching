import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";

// ✅ ENGINE imports
import { getDayAvailability } from "@/engine/scheduling/availability/getDayAvailability";
import { SLOT_SIZE_MIN } from "@/engine/scheduling/time/timeMath";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  let created = 0;

  for (let day = new Date(today); day < end; day.setUTCDate(day.getUTCDate() + 1)) {
    // ✅ engine decides availability windows
    const intervals = await getDayAvailability(day);
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

/* ---------- RANK SNAPSHOT LOGIC (UNCHANGED) ---------- */

type RiotRank = { tier: string; division?: string | null; lp: number };

const RATE_PER_MIN = 40;
const INTERVAL_MS = Math.ceil(60000 / RATE_PER_MIN);
const MAX_DURATION_MS = 50_000;

async function fetchRank(origin: string, server: string, puuid: string): Promise<RiotRank | null> {
  const url = `${origin}/api/riot/rank?server=${encodeURIComponent(server)}&puuid=${encodeURIComponent(puuid)}`;
  for (let i = 0; i < 2; i++) {
    const ac = new AbortController();
    const tm = setTimeout(() => ac.abort(), 12000);
    try {
      const r = await fetch(url, { cache: "no-store", signal: ac.signal });
      if (r.ok) {
        const j: any = await r.json().catch(() => ({}));
        const s = j?.solo ?? j?.data ?? j;
        return {
          tier: s?.tier ?? "UNRANKED",
          division: s?.division ?? s?.rank ?? null,
          lp: Number(s?.lp ?? s?.leaguePoints ?? 0) || 0,
        };
      }
    } catch {}
    clearTimeout(tm);
    await sleep(1000);
  }
  return null;
}

async function createRankSnapshots(origin: string) {
  const students = await prisma.student.findMany({
    where: { puuid: { not: null }, server: { not: null } },
    select: { id: true, puuid: true, server: true },
    orderBy: { createdAt: "asc" },
  });

  const capturedAt = new Date();
  const todayUtc = startOfTodayUTC();
  const start = Date.now();

  const rows: { studentId: string; capturedAt: Date; tier: string; division: string | null; lp: number }[] = [];

  for (const s of students) {
    if (Date.now() - start > MAX_DURATION_MS) break;

    const rank = await fetchRank(origin, s.server!, s.puuid!);
    if (rank) {
      rows.push({
        studentId: s.id,
        capturedAt,
        tier: rank.tier,
        division: rank.division ?? null,
        lp: rank.lp,
      });
    }

    await sleep(INTERVAL_MS);
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
    studentsScanned: students.length,
    snapshotsAttempted: rows.length,
    snapshotsInserted: inserted,
    dayUTC: todayUtc.toISOString().slice(0, 10),
  };
}

async function runAll(origin: string) {
  const results = { cleanup: null as any, slots: null as any, ranks: null as any, errors: [] as string[] };

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
    results.ranks = await createRankSnapshots(origin);
  } catch (e: any) {
    results.errors.push(`ranks: ${e?.message || e}`);
  }
    try {
    await assignDailyDraft();
  } catch (e: any) {
    results.errors.push(`dailyDraft: ${e?.message || e}`);
  }

  return results;
}

export async function GET(req: NextRequest) {
  const fromVercel = !!req.headers.get("x-vercel-cron") || !!req.headers.get("x-vercel-signature");
  const secret = (process.env.CRON_SECRET || "").trim();
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!fromVercel && (!secret || token !== secret)) return unauthorized();

  const origin =
    (process.env.CANONICAL_URL || process.env.NEXT_PUBLIC_SITE_URL || "").trim() ||
    req.nextUrl.origin;

  const result = await runAll(origin);

  console.log("CRON RESULT:", JSON.stringify({ result }));

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
async function assignDailyDraft() {
  const draft = await prisma.draft.findFirst({
    where: { status: "APPROVED" },
    orderBy: { usedLast: "asc" }, // nulls first = never used
  });

  if (!draft) return;

  await prisma.draft.update({
    where: { id: draft.id },
    data: { usedLast: new Date() },
  });
}
