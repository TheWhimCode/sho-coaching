import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: { championId: string; spellKey: string; rank: number; correct: boolean; clientId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const { championId, spellKey, rank, correct, clientId } = body;

  await prisma.cooldownStat.upsert({
    where: {
      championId_spellKey_rank: { championId, spellKey, rank },
    },
    create: {
      championId,
      spellKey,
      rank,
      attempts: 1,
      correctAttempts: correct ? 1 : 0,
    },
    update: {
      attempts: { increment: 1 },
      ...(correct ? { correctAttempts: { increment: 1 } } : {}),
    },
  });

  const clientIdTrimmed =
    typeof clientId === "string" && clientId.trim().length > 0 ? clientId.trim().slice(0, 64) : null;
  if (clientIdTrimmed) {
    await prisma.leaderboardEntry.updateMany({
      where: { clientId: clientIdTrimmed },
      data: {
        cooldownsAttempts: { increment: 1 },
        ...(correct && { cooldownsCorrectAttempts: { increment: 1 } }),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
