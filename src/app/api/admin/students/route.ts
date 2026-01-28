// src/app/api/admin/students/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    // 1) Fetch students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        name: true,
        discordName: true,
        riotTag: true,
        server: true,
        puuid: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const studentIds = students.map((s) => s.id);

    // 2) Latest session start per student (for sorting)
    const latestByStudent = await prisma.session.groupBy({
      by: ["studentId"],
      where: { studentId: { in: studentIds } },
      _max: { scheduledStart: true },
    });

    const latestMap = new Map<string, Date>();
    for (const row of latestByStudent) {
      if (row.studentId && row._max.scheduledStart) {
        latestMap.set(String(row.studentId), row._max.scheduledStart);
      }
    }

    // 3) Fetch sessions for these students (DON'T use champions.isEmpty)
    const sessions = await prisma.session.findMany({
      where: {
        studentId: { in: studentIds as any },
        // optional:
        // status: "paid",
      },
      select: {
        studentId: true,
        champions: true, // string[] (or possibly null)
      },
    });

    // 4) Build union map: studentId -> Set(champions) using STRING keys
    const championsByStudent = new Map<string, Set<string>>();

    for (const row of sessions) {
      const sid = String(row.studentId);
      if (!championsByStudent.has(sid)) championsByStudent.set(sid, new Set());

      const set = championsByStudent.get(sid)!;
      const arr = Array.isArray(row.champions) ? row.champions : [];

      for (const champ of arr) {
        const c = String(champ).trim();
        if (c) set.add(c);
      }
    }

    // 5) Attach latestSessionStart + allChampions, then sort
    const shaped = students
      .map((s) => {
        const latest = latestMap.get(String(s.id)) ?? null;

        return {
          ...s,
          latestSessionStart: latest, // Date | null (serializes to ISO)
          allChampions: Array.from(championsByStudent.get(String(s.id)) ?? []),
        };
      })
      .sort((a, b) => {
        const at = a.latestSessionStart ? a.latestSessionStart.getTime() : -1;
        const bt = b.latestSessionStart ? b.latestSessionStart.getTime() : -1;
        return bt - at;
      });

    return NextResponse.json(
      { students: shaped },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (err) {
    console.error("GET /api/admin/students failed", err);
    return NextResponse.json({ students: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, riotTag } = await req.json();

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const created = await prisma.student.create({
      data: {
        name: name.trim(),
        riotTag: riotTag ? String(riotTag).trim() : null,
      },
    });

    // Keep response backward-compatible with the GET shape fields
    return NextResponse.json(
      {
        ...created,
        latestSessionStart: null,
        allChampions: [],
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/admin/students failed", err);
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Student with this name/riotTag already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
