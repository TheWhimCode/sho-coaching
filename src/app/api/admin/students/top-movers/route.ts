import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") ?? 7);

  const today = new Date();
  const past = new Date();
  past.setDate(today.getDate() - days);

  const pastStart = new Date(
    `${past.toISOString().slice(0, 10)}T00:00:00.000Z`
  );

  try {
    // --------------------------------------------------
    // 1) Compute LP deltas (top 3 by absolute change)
    // --------------------------------------------------
    const raw = await prisma.$queryRaw<
      { studentId: string; delta: number }[]
    >`
      WITH latest_today AS (
        SELECT DISTINCT ON ("studentId")
          "studentId", "lp"
        FROM "RankSnapshot"
        ORDER BY "studentId", "capturedAt" DESC
      ),

      latest_past AS (
        SELECT DISTINCT ON ("studentId")
          "studentId", "lp"
        FROM "RankSnapshot"
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

    if (!raw.length) {
      return NextResponse.json({ students: [] });
    }

    const studentIds = raw.map((r) => r.studentId);

    // --------------------------------------------------
    // 2) Fetch students
    // --------------------------------------------------
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
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

    const byId = new Map(students.map((s) => [String(s.id), s]));

    // --------------------------------------------------
    // 3) Fetch sessions → union champions (same as /students)
    // --------------------------------------------------
    const sessions = await prisma.session.findMany({
      where: { studentId: { in: studentIds as any } },
      select: {
        studentId: true,
        champions: true,
      },
    });

    const championsByStudent = new Map<string, Set<string>>();

    for (const row of sessions) {
      const sid = String(row.studentId);
      if (!championsByStudent.has(sid)) {
        championsByStudent.set(sid, new Set());
      }

      const set = championsByStudent.get(sid)!;
      const arr = Array.isArray(row.champions) ? row.champions : [];

      for (const champ of arr) {
        const c = String(champ).trim();
        if (c) set.add(c);
      }
    }

    // --------------------------------------------------
    // 4) Merge + shape exactly for StudentCard
    // --------------------------------------------------
    const merged = raw
      .map((r) => {
        const s = byId.get(String(r.studentId));
        if (!s) return null;

        return {
          student: {
            ...s,
            allChampions: Array.from(
              championsByStudent.get(String(s.id)) ?? []
            ),
          },
          delta: r.delta,
        };
      })
      .filter(Boolean);

    return NextResponse.json(
      { students: merged },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (err) {
    console.error("GET /api/admin/students/top-movers failed", err);
    return NextResponse.json({ students: [] }, { status: 500 });
  }
}
