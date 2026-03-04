import { Prisma } from "@prisma/client";
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

  // get oldest usedLast in DB
  const oldest = await prisma.draft.findFirst({
    where: { status: "APPROVED" },
    orderBy: { usedLast: "asc" },
    select: { usedLast: true },
  });

  const updateData: {
    status: string;
    answers: Prisma.InputJsonValue;
    usedLast: Date | null;
    madeBy?: string | null;
  } = {
    status,
    answers: answers as Prisma.InputJsonValue,
    usedLast: status === "APPROVED"
      ? oldest?.usedLast ?? new Date(0)
      : null,
  };

  if (status === "APPROVED" && madeBy !== undefined) {
    updateData.madeBy =
      typeof madeBy === "string" && madeBy.trim() ? madeBy.trim() : null;
  }

  await prisma.draft.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ ok: true });
}
