import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: { dayKey: string; itemId: string; correct: boolean };
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

  const { dayKey, itemId, correct } = body;

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

  return NextResponse.json({ ok: true });
}
