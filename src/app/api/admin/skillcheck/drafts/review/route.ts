import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { id, status, answers } = await req.json();

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status" },
      { status: 400 }
    );
  }

  // get oldest usedLast in DB
  const oldest = await prisma.draft.findFirst({
    where: { status: "APPROVED" },
    orderBy: { usedLast: "asc" },
    select: { usedLast: true },
  });

  await prisma.draft.update({
    where: { id },
    data: {
      status,
      answers, // finalized answers from AnswerAuthorPanel
      usedLast: status === "APPROVED"
        ? oldest?.usedLast ?? new Date(0)
        : null,
    },
  });

  return NextResponse.json({ ok: true });
}
