import { prisma } from "@/lib/prisma";

/**
 * Champion names from each student's **most recent session** only (by `scheduledStart`).
 * Used for admin student cards — avoids scanning all historical sessions per student.
 */
export async function getLastSessionChampionsByStudentIds(
  studentIds: string[]
): Promise<{
  latestSessionStartByStudent: Map<string, Date>;
  championsByStudent: Map<string, string[]>;
}> {
  const latestSessionStartByStudent = new Map<string, Date>();
  const championsByStudent = new Map<string, string[]>();

  if (studentIds.length === 0) {
    return { latestSessionStartByStudent, championsByStudent };
  }

  const latestByStudent = await prisma.session.groupBy({
    by: ["studentId"],
    where: { studentId: { in: studentIds } },
    _max: { scheduledStart: true },
  });

  const orConditions: { studentId: string; scheduledStart: Date }[] = [];
  for (const row of latestByStudent) {
    if (row.studentId && row._max.scheduledStart) {
      const sid = String(row.studentId);
      latestSessionStartByStudent.set(sid, row._max.scheduledStart);
      orConditions.push({
        studentId: row.studentId,
        scheduledStart: row._max.scheduledStart,
      });
    }
  }

  if (orConditions.length === 0) {
    return { latestSessionStartByStudent, championsByStudent };
  }

  const sessions = await prisma.session.findMany({
    where: {
      OR: orConditions.map((c) => ({
        AND: [
          { studentId: c.studentId },
          { scheduledStart: c.scheduledStart },
        ],
      })),
    },
    select: { studentId: true, champions: true },
  });

  for (const row of sessions) {
    const sid = String(row.studentId);
    const arr = Array.isArray(row.champions) ? row.champions : [];
    const names = arr.map((c) => String(c).trim()).filter(Boolean);
    if (!championsByStudent.has(sid)) {
      championsByStudent.set(sid, names);
    } else {
      const seen = new Set(championsByStudent.get(sid)!);
      for (const n of names) seen.add(n);
      championsByStudent.set(sid, Array.from(seen));
    }
  }

  return { latestSessionStartByStudent, championsByStudent };
}
