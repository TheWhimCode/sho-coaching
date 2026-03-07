import { DraftStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { id, status, answers, madeBy } = await req.json();

  if (!["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status" },
      { status: 400 }
    );
  }

  const draftStatus = status as DraftStatus;

  // When approving: put draft at front of queue = oldest usedLast in DB minus 1 day
  // (cron picks oldest first, so this draft gets picked next). E.g. oldest 10/03 → this becomes 09/03.
  const oldest =
    draftStatus === "APPROVED"
      ? await prisma.draft.findFirst({
          where: { status: "APPROVED", usedLast: { not: null } },
          orderBy: { usedLast: "asc" },
          select: { usedLast: true },
        })
      : null;

  const oneDayMs = 24 * 60 * 60 * 1000;
  const usedLastWhenApproved =
    draftStatus === "APPROVED"
      ? oldest?.usedLast
        ? new Date(oldest.usedLast.getTime() - oneDayMs)
        : new Date(0)
      : null;

  const updateData: {
    status: DraftStatus;
    answers: Prisma.InputJsonValue;
    usedLast: Date | null;
    madeBy?: string | null;
  } = {
    status: draftStatus,
    answers: answers as Prisma.InputJsonValue,
    usedLast: usedLastWhenApproved,
  };

  if (draftStatus === "APPROVED" && madeBy !== undefined) {
    updateData.madeBy =
      typeof madeBy === "string" && madeBy.trim() ? madeBy.trim() : null;
  }

  await prisma.draft.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ ok: true });
}
