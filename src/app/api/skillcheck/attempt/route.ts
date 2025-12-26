import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { draftId, correct } = await req.json();

  await prisma.draft.update({
    where: { id: draftId },
    data: {
      attempts: { increment: 1 },
      ...(correct && { correctAttempts: { increment: 1 } }),
    },
  });

  return NextResponse.json({ ok: true });
}
