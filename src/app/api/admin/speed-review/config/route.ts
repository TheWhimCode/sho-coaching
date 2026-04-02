import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const row = await prisma.speedReviewConfig.findUnique({
    where: { id: "default" },
  });
  if (!row) {
    const created = await prisma.speedReviewConfig.create({
      data: { id: "default" },
      select: { nextSessionAt: true, updatedAt: true },
    });
    return NextResponse.json({
      nextSessionAt: created.nextSessionAt?.toISOString() ?? null,
      updatedAt: created.updatedAt.toISOString(),
    });
  }
  return NextResponse.json({
    nextSessionAt: row.nextSessionAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  });
}

const PatchZ = z.object({
  nextSessionAt: z.string().datetime().nullable().optional(),
  clear: z.boolean().optional(),
});

export async function PATCH(req: Request) {
  let body: z.infer<typeof PatchZ>;
  try {
    body = PatchZ.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  let next: Date | null | undefined;
  if (body.clear) {
    next = null;
  } else if (body.nextSessionAt !== undefined) {
    next = body.nextSessionAt === null ? null : new Date(body.nextSessionAt);
  }

  const row = await prisma.speedReviewConfig.upsert({
    where: { id: "default" },
    create: { id: "default", nextSessionAt: next ?? null },
    update: { ...(next !== undefined ? { nextSessionAt: next } : {}) },
    select: { nextSessionAt: true, updatedAt: true },
  });

  return NextResponse.json({
    nextSessionAt: row.nextSessionAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  });
}
