export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const HOLD_TTL_MIN = 10;

const PostZ = z.object({ slotId: z.string(), holdKey: z.string().optional() });
export async function POST(req: Request) {
  const { slotId, holdKey } = PostZ.parse(await req.json());
  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot || slot.isTaken) return NextResponse.json({ error: "unavailable" }, { status: 409 });

  const now = new Date();
  if (slot.holdUntil && slot.holdUntil < now) {
    // expired -> clear
    await prisma.slot.update({ where: { id: slotId }, data: { holdUntil: null, holdKey: null } });
  }

  const newKey = holdKey || crypto.randomUUID();
  const holdUntil = new Date(now.getTime() + HOLD_TTL_MIN * 60_000);
  await prisma.slot.update({
    where: { id: slotId },
    data: { holdKey: newKey, holdUntil },
  });

  return NextResponse.json({ ok: true, holdKey: newKey, holdUntil: holdUntil.toISOString() });
}

const DelZ = z.object({ slotId: z.string(), holdKey: z.string().optional() });
export async function DELETE(req: Request) {
  const { slotId, holdKey } = DelZ.parse(await req.json());
  // best-effort release (match key if present)
  await prisma.slot.updateMany({
    where: { id: slotId, ...(holdKey ? { holdKey } : {}) },
    data: { holdKey: null, holdUntil: null },
  });
  return NextResponse.json({ ok: true });
}
