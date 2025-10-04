// src/app/api/admin/students/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      orderBy: { updatedAt: "desc" },
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
    return NextResponse.json(
      { students },
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

    return NextResponse.json(created, { status: 201 });
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
