import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma, SpeedReviewStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PatchZ = z.object({
  globalName: z.string().max(64).nullable().optional(),
  discordName: z.string().max(64).nullable().optional(),
  discordId: z.string().min(1).max(32).optional(),
  riotTag: z.string().min(1).max(64).optional(),
  puuid: z.string().max(128).nullable().optional(),
  role: z.string().min(1).max(32).optional(),
  queueDate: z.string().datetime().optional(),
  previousReviews: z.number().int().min(0).max(999).optional(),
  paidPriority: z.boolean().optional(),
  reviewStatus: z.enum(["Pending", "Done"]).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let body: z.infer<typeof PatchZ>;
  try {
    body = PatchZ.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const current = await prisma.speedReviewQueue.findUnique({
    where: { id },
    select: { reviewStatus: true },
  });
  if (!current) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data: Prisma.SpeedReviewQueueUpdateInput = {};
  if (body.globalName !== undefined) data.globalName = body.globalName;
  if (body.discordName !== undefined) data.discordName = body.discordName;
  if (body.discordId !== undefined) data.discordId = body.discordId;
  if (body.riotTag !== undefined) data.riotTag = body.riotTag;
  if (body.puuid !== undefined) data.puuid = body.puuid;
  if (body.role !== undefined) data.role = body.role;
  if (body.queueDate !== undefined) data.queueDate = new Date(body.queueDate);
  if (body.previousReviews !== undefined) data.previousReviews = body.previousReviews;
  if (body.paidPriority !== undefined) data.paidPriority = body.paidPriority;
  if (body.reviewStatus !== undefined) data.reviewStatus = body.reviewStatus as SpeedReviewStatus;
  if (
    body.reviewStatus === "Done" &&
    current.reviewStatus !== "Done" &&
    body.previousReviews === undefined
  ) {
    data.previousReviews = { increment: 1 };
  }

  try {
    const row = await prisma.speedReviewQueue.update({
      where: { id },
      data,
    });
    return NextResponse.json({ ok: true, row });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "discord_id_conflict" }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    await prisma.speedReviewQueue.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    throw e;
  }
}
