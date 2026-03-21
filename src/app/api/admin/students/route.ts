// src/app/api/admin/students/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLastSessionChampionsByStudentIds } from "@/lib/admin/studentLastSessionChampions";

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

    const { latestSessionStartByStudent, championsByStudent } =
      await getLastSessionChampionsByStudentIds(studentIds);

    // `allChampions`: champions from **latest session only** (icons on cards)
    const shaped = students
      .map((s) => {
        const id = String(s.id);
        const latest = latestSessionStartByStudent.get(id) ?? null;

        return {
          ...s,
          latestSessionStart: latest, // Date | null (serializes to ISO)
          allChampions: championsByStudent.get(id) ?? [],
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
