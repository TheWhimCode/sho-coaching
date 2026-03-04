import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dayKey, championId, correct } = body;
    if (!dayKey || !championId || typeof correct !== "boolean") {
      return NextResponse.json(
        { error: "dayKey, championId, correct required" },
        { status: 400 }
      );
    }

    await prisma.runeStat.upsert({
      where: {
        dayKey_championId: { dayKey, championId },
      },
      create: {
        dayKey,
        championId,
        attempts: 1,
        correctAttempts: correct ? 1 : 0,
      },
      update: {
        attempts: { increment: 1 },
        ...(correct ? { correctAttempts: { increment: 1 } } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[skillcheck/runes/attempt]", e);
    return NextResponse.json({ error: "Failed to record attempt" }, { status: 500 });
  }
}
