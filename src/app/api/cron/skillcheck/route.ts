import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureRuneDailyForDay } from "@/lib/skillcheck/ensureRuneDaily";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}

function ymdUTC(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

/* ✅ cleanup rejected drafts */
async function cleanupRejectedDrafts() {
  const res = await prisma.draft.deleteMany({
    where: { status: "REJECTED" },
  });
  return res.count;
}

async function assignDailyDraft() {
  const draft = await prisma.draft.findFirst({
    where: { status: "APPROVED" },
    orderBy: { usedLast: "asc" },
  });

  if (!draft) return { assigned: false as const, draftId: null as string | null };

  await prisma.draft.update({
    where: { id: draft.id },
    data: { usedLast: new Date() },
  });

  return { assigned: true as const, draftId: draft.id };
}

async function runSkillcheck() {
  const dayKey = ymdUTC(new Date());
  const results = {
    cleanupRejectedDrafts: null as any,
    dailyDraft: null as any,
    runeDaily: null as any,
    errors: [] as string[],
  };

  try {
    results.cleanupRejectedDrafts = { deleted: await cleanupRejectedDrafts() };
  } catch (e: any) {
    results.errors.push(`cleanupRejectedDrafts: ${e?.message || e}`);
  }

  try {
    results.dailyDraft = await assignDailyDraft();
  } catch (e: any) {
    results.errors.push(`assignDailyDraft: ${e?.message || e}`);
  }

  try {
    results.runeDaily = await ensureRuneDailyForDay(dayKey);
  } catch (e: any) {
    results.errors.push(`ensureRuneDaily: ${e?.message || e}`);
    console.error("[skillcheck:cron] ensureRuneDaily threw", e);
  }

  return results;
}

export async function GET(req: NextRequest) {
  const fromVercel = !!req.headers.get("x-vercel-cron") || !!req.headers.get("x-vercel-signature");
  const secret = (process.env.CRON_SECRET || "").trim();
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!fromVercel && (!secret || token !== secret)) return unauthorized();

  const result = await runSkillcheck();

  console.log("SKILLCHECK CRON RESULT:", JSON.stringify({ result }));

  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
