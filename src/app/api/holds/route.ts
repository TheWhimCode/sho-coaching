// app/api/holds/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const HOLD_TTL_MIN = 10;

const PostZ = z.object({ slotId: z.string(), holdKey: z.string().optional() });

export async function POST(req: Request) {
  const { slotId, holdKey } = PostZ.parse(await req.json());

  const now = new Date();
  const newKey = holdKey || crypto.randomUUID();
  const holdUntil = new Date(now.getTime() + HOLD_TTL_MIN * 60_000);

  // Keep status as-is (do NOT flip to blocked here).
  const updated = await prisma.slot.updateMany({
    where: { id: slotId }, // optionally add { status: "free" }
    data: { holdKey: newKey, holdUntil },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "unavailable" }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    holdKey: newKey,
    holdUntil: holdUntil.toISOString(),
  });
}

const DelZ = z.object({ slotId: z.string(), holdKey: z.string().optional() });

export async function DELETE(req: Request) {
  const { slotId, holdKey } = DelZ.parse(await req.json());

  // Best-effort release (don’t touch status). If a holdKey is provided, match it.
  await prisma.slot.updateMany({
    where: { id: slotId, ...(holdKey ? { holdKey } : {}) },
    data: { holdKey: null, holdUntil: null },
  });

  return NextResponse.json({ ok: true });
}
