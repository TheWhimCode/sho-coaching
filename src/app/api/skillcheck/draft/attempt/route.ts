import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: { draftId: string; correct: boolean; clientId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const { draftId, correct, clientId } = body;
  if (!draftId || typeof correct !== "boolean") {
    return NextResponse.json({ error: "draftId and correct required" }, { status: 400 });
  }

  await prisma.draft.update({
    where: { id: draftId },
    data: {
      attempts: { increment: 1 },
      ...(correct && { correctAttempts: { increment: 1 } }),
    },
  });

  const clientIdTrimmed =
    typeof clientId === "string" && clientId.trim().length > 0 ? clientId.trim().slice(0, 64) : null;
  if (clientIdTrimmed) {
    await prisma.leaderboardEntry.updateMany({
      where: { clientId: clientIdTrimmed },
      data: {
        draftAttempts: { increment: 1 },
        ...(correct && { draftCorrectAttempts: { increment: 1 } }),
      },
    });
  }

  return NextResponse.json({ ok: true });
}
