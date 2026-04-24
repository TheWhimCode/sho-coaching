import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { speedReviewQueueOrderBy } from "@/lib/speedReview/queueOrder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: next session time + pending queue (sorted server-side). */
export async function GET() {
  const config = await prisma.speedReviewConfig.findUnique({
    where: { id: "default" },
    select: { nextSessionAt: true },
  });

  const rows = await prisma.speedReviewQueue.findMany({
    where: { reviewStatus: "Pending" },
    orderBy: speedReviewQueueOrderBy,
    select: {
      globalName: true,
      discordName: true,
      role: true,
      previousReviews: true,
    },
  });

  const queue = rows.map((r, i) => ({
    position: i + 1,
    globalName: r.globalName ?? "",
    discordName: r.discordName ?? "—",
    role: r.role,
    previousReviews: r.previousReviews,
  }));

  return NextResponse.json(
    {
      nextSessionAt: config?.nextSessionAt?.toISOString() ?? null,
      queue,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
