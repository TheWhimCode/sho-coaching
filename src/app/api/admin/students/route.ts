// src/app/api/admin/students/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const students = await prisma.student.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      discord: true,
      riotTag: true,
      server: true,
      puuid: true,
      summonerId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ students });
}
