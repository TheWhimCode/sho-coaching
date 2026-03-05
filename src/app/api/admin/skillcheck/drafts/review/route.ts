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

  // When approving: put draft at back of queue = give it the newest usedLast
  // (cron picks oldest first, so newest = last to be picked). Avoids ties.
  const newest =
    draftStatus === "APPROVED"
      ? await prisma.draft.findFirst({
          where: { status: "APPROVED", id: { not: id } },
          orderBy: { usedLast: "desc" },
          select: { usedLast: true },
        })
      : null;

  const updateData: {
    status: DraftStatus;
    answers: Prisma.InputJsonValue;
    usedLast: Date | null;
    madeBy?: string | null;
  } = {
    status: draftStatus,
    answers: answers as Prisma.InputJsonValue,
    usedLast:
      draftStatus === "APPROVED"
        ? newest?.usedLast
          ? new Date(newest.usedLast.getTime() + 1)
          : new Date(0)
        : null,
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
