// app/api/admin/students/top-movers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") ?? 7);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const past = new Date();
  past.setDate(today.getDate() - days);
  const pastStr = past.toISOString().slice(0, 10);

  const pastStart = new Date(`${pastStr}T00:00:00.000Z`);

  let raw: { studentId: string; delta: number }[] = [];

  try {
    raw = await prisma.$queryRaw<
      { studentId: string; delta: number }[]
    >`
      WITH latest_today AS (
        SELECT DISTINCT ON ("studentId")
          "studentId", "lp"
        FROM "RankSnapshot"
        ORDER BY "studentId", "capturedAt" DESC
      ),

      latest_past_raw AS (
        -- all snapshots
        SELECT
          "studentId",
          "lp",
          "capturedAt"
        FROM "RankSnapshot"
      ),

      latest_past AS (
        -- ideal baseline
        SELECT DISTINCT ON ("studentId")
          "studentId", "lp"
        FROM latest_past_raw
        WHERE "capturedAt" <= ${pastStart}
        ORDER BY "studentId", "capturedAt" DESC
      ),

      earliest_snap AS (
        SELECT DISTINCT ON ("studentId")
          "studentId", "lp"
        FROM "RankSnapshot"
        ORDER BY "studentId", "capturedAt" ASC
      ),

      past_final AS (
        SELECT
          s."studentId",
          COALESCE(lp."lp", es."lp") AS "lp"
        FROM (
          SELECT DISTINCT "studentId" FROM "RankSnapshot"
        ) s
        LEFT JOIN latest_past lp ON lp."studentId" = s."studentId"
        LEFT JOIN earliest_snap es ON es."studentId" = s."studentId"
      )

      SELECT
        t."studentId",
        (t."lp" - p."lp") AS "delta"
      FROM latest_today t
      JOIN past_final p ON p."studentId" = t."studentId"
      ORDER BY ABS(t."lp" - p."lp") DESC
      LIMIT 3;
    `;
  } catch (err) {
    console.error("SQL error in top-movers:", err);
    return NextResponse.json({ students: [] });
  }

  if (!raw.length) {
    return NextResponse.json({ students: [] });
  }

  const students = await prisma.student.findMany({
    where: { id: { in: raw.map((r) => r.studentId) } },
    select: {
      id: true,
      name: true,
      discordName: true,
      riotTag: true,
      server: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const merged = raw.map((entry) => ({
    student: students.find((s) => s.id === entry.studentId)!,
    delta: entry.delta
  }));

  return NextResponse.json({ students: merged });
}
