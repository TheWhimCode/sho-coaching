import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { speedReviewQueueOrderBy } from "@/lib/speedReview/queueOrder";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const status = searchParams.get("status") as "Pending" | "Done" | null;
  const paid = searchParams.get("paid");

  const where: Prisma.SpeedReviewQueueWhereInput = {};

  if (status === "Pending" || status === "Done") {
    where.reviewStatus = status;
  }

  if (paid === "true") where.paidPriority = true;
  if (paid === "false") where.paidPriority = false;

  if (q) {
    where.OR = [
      { discordName: { contains: q, mode: "insensitive" } },
      { riotTag: { contains: q, mode: "insensitive" } },
      { discordId: { contains: q } },
    ];
  }

  const rows = await prisma.speedReviewQueue.findMany({
    where,
    orderBy: speedReviewQueueOrderBy,
    select: {
      id: true,
      discordId: true,
      discordName: true,
      riotTag: true,
      puuid: true,
      role: true,
      queueDate: true,
      previousReviews: true,
      paidPriority: true,
      reviewStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ rows });
}
