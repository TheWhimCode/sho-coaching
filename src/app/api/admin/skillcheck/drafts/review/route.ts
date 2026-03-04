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

  // get oldest usedLast in DB
  const oldest = await prisma.draft.findFirst({
    where: { status: "APPROVED" },
    orderBy: { usedLast: "asc" },
    select: { usedLast: true },
  });

  const updateData: {
    status: DraftStatus;
    answers: Prisma.InputJsonValue;
    usedLast: Date | null;
    madeBy?: string | null;
  } = {
    status: draftStatus,
    answers: answers as Prisma.InputJsonValue,
    usedLast: draftStatus === "APPROVED"
      ? oldest?.usedLast ?? new Date(0)
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
