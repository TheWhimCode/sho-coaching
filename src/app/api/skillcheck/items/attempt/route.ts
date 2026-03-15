import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: { dayKey: string; itemId: string; correct: boolean; clientId?: string };
  try {
    body = await req.json();
    if (
      typeof body?.dayKey !== "string" ||
      typeof body?.itemId !== "string" ||
      typeof body?.correct !== "boolean"
    ) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { dayKey, itemId, correct, clientId } = body;

  await prisma.itemStat.upsert({
    where: {
      dayKey_itemId: { dayKey, itemId },
    },
    create: {
      dayKey,
      itemId,
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
        itemsAttempts: { increment: 1 },
        ...(correct && { itemsCorrectAttempts: { increment: 1 } }),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
