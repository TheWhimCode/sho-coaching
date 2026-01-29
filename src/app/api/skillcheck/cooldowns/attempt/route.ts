import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { championId, spellKey, rank, correct } = await req.json();

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

  return NextResponse.json({ ok: true });
}
