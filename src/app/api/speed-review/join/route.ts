import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { resolveRiotTagToPuuid } from "@/lib/speedReview/resolveRiotTag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodyZ = z.object({
  discordId: z.string().min(1).max(32),
  discordName: z.string().max(64).nullable().optional(),
  riotTag: z.string().min(3).max(64),
  role: z.string().min(1).max(32),
});

const queueSelect = {
  id: true,
  previousReviews: true,
  paidPriority: true,
  reviewStatus: true,
} as const;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`speed-review:join:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: z.infer<typeof BodyZ>;
  try {
    body = BodyZ.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const puuid = await resolveRiotTagToPuuid(body.riotTag);
  if (!puuid) {
    return NextResponse.json({ error: "riot_not_found" }, { status: 400 });
  }

  const discordId = body.discordId.trim();
  const discordName = body.discordName?.trim() || null;
  const riotTag = body.riotTag.trim();
  const role = body.role.trim();
  const queueDate = new Date();

  const byDiscord = await prisma.speedReviewQueue.findUnique({
    where: { discordId },
    select: queueSelect,
  });

  const byPuuid = await prisma.speedReviewQueue.findFirst({
    where: { puuid },
    select: queueSelect,
  });

  const mergedPaidPriority = (a: {
    paidPriority: boolean;
    reviewStatus: "Pending" | "Done";
  }) =>
    a.reviewStatus === "Done" ? false : a.paidPriority;

  try {
    // Same row (or only one lookup path)
    if (byDiscord && byPuuid && byDiscord.id === byPuuid.id) {
      const row = await prisma.speedReviewQueue.update({
        where: { id: byDiscord.id },
        data: {
          discordName,
          riotTag,
          puuid,
          role,
          queueDate,
          previousReviews: byDiscord.previousReviews,
          reviewStatus: "Pending",
          paidPriority: mergedPaidPriority(byDiscord),
        },
        select: { id: true },
      });
      return NextResponse.json({ ok: true, id: row.id }, { headers: { "Cache-Control": "no-store" } });
    }

    // Two different rows: same person re-linked under discord vs riot — merge into discord row
    if (byDiscord && byPuuid && byDiscord.id !== byPuuid.id) {
      const row = await prisma.$transaction(async (tx) => {
        await tx.speedReviewQueue.update({
          where: { id: byDiscord.id },
          data: {
            discordName,
            riotTag,
            puuid,
            role,
            queueDate,
            previousReviews: byDiscord.previousReviews + byPuuid.previousReviews,
            reviewStatus: "Pending",
            paidPriority:
              byDiscord.reviewStatus === "Done" || byPuuid.reviewStatus === "Done"
                ? false
                : byDiscord.paidPriority || byPuuid.paidPriority,
          },
        });
        await tx.speedReviewQueue.delete({ where: { id: byPuuid.id } });
        return tx.speedReviewQueue.findUniqueOrThrow({
          where: { id: byDiscord.id },
          select: { id: true },
        });
      });
      return NextResponse.json({ ok: true, id: row.id }, { headers: { "Cache-Control": "no-store" } });
    }

    if (byDiscord) {
      const row = await prisma.speedReviewQueue.update({
        where: { id: byDiscord.id },
        data: {
          discordName,
          riotTag,
          puuid,
          role,
          queueDate,
          previousReviews: byDiscord.previousReviews,
          reviewStatus: "Pending",
          paidPriority: mergedPaidPriority(byDiscord),
        },
        select: { id: true },
      });
      return NextResponse.json({ ok: true, id: row.id }, { headers: { "Cache-Control": "no-store" } });
    }

    if (byPuuid) {
      const row = await prisma.speedReviewQueue.update({
        where: { id: byPuuid.id },
        data: {
          discordId,
          discordName,
          riotTag,
          puuid,
          role,
          queueDate,
          previousReviews: byPuuid.previousReviews,
          reviewStatus: "Pending",
          paidPriority: mergedPaidPriority(byPuuid),
        },
        select: { id: true },
      });
      return NextResponse.json({ ok: true, id: row.id }, { headers: { "Cache-Control": "no-store" } });
    }

    const row = await prisma.speedReviewQueue.create({
      data: {
        discordId,
        discordName,
        riotTag,
        puuid,
        role,
        queueDate,
        previousReviews: 0,
        paidPriority: false,
        reviewStatus: "Pending",
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: row.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json({ error: "queue_identity_conflict" }, { status: 409 });
    }
    throw e;
  }
}
