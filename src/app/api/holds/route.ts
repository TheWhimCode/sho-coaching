import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { SlotStatus } from "@prisma/client";
import { getBlockIdsByTime } from "@/lib/booking/block";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOLD_TTL_MIN = 10;
const MAX_TTL_MIN = 15;
const TTL_MIN = Math.min(HOLD_TTL_MIN, MAX_TTL_MIN);

const PostZ = z.object({
  slotId: z.string().min(1).max(64),
  // total live duration for this session (base + in-game blocks), in minutes
  liveMinutes: z.coerce.number().int().min(30).max(240), // coerce to accept strings
  // optional: reuse existing key to extend/refresh the same client's hold
  holdKey: z.string().min(1).max(128).optional(),
});

const DelZ = z.object({
  holdKey: z.string().min(1).max(128).optional(),
  slotId: z.string().min(1).max(64).optional(),
  slotIds: z.array(z.string().min(1).max(64)).optional(),
});

function noStore(json: unknown, status = 200): NextResponse {
  const res = NextResponse.json(json, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(req: Request) {
  if (req.method !== "POST") return noStore({ error: "method_not_allowed" }, 405);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`holds:post:${ip}`, 60, 60_000)) {
    return noStore({ error: "rate_limited" }, 429);
  }

  let body: z.infer<typeof PostZ>;
  try {
    body = PostZ.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "invalid body";
    return noStore({ error: "bad_request", detail: msg }, 400);
  }

  const { slotId, liveMinutes } = body;
  const clientKey = body.holdKey || crypto.randomUUID();

  const start = await prisma.slot.findUnique({
    where: { id: slotId },
    select: { id: true, startTime: true, status: true, holdKey: true, holdUntil: true },
  });
  if (!start) return noStore({ error: "not_found" }, 404);

  const blockIds = await getBlockIdsByTime(start.startTime, liveMinutes, prisma, { holdKey: clientKey });
  if (!blockIds) return noStore({ error: "unavailable" }, 409);

  const now = new Date();
  const holdUntil = new Date(now.getTime() + TTL_MIN * 60_000);

  const updated = await prisma.slot.updateMany({
    where: {
      id: { in: blockIds },
      status: SlotStatus.free,
      OR: [
        { holdUntil: null },
        { holdUntil: { lt: now } },
        { AND: [{ holdKey: clientKey }, { holdUntil: { gt: now } }] },
      ],
    },
    data: { holdKey: clientKey, holdUntil },
  });

  if (updated.count !== blockIds.length) {
    return noStore({ error: "unavailable" }, 409);
  }

  return noStore({
    ok: true,
    holdKey: clientKey,
    holdUntil: holdUntil.toISOString(),
    slotIds: blockIds,
  });
}

export async function DELETE(req: Request) {
  if (req.method !== "DELETE") return noStore({ error: "method_not_allowed" }, 405);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`holds:del:${ip}`, 60, 60_000)) {
    return noStore({ error: "rate_limited" }, 429);
  }

  let body: z.infer<typeof DelZ>;
  try {
    body = DelZ.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "invalid body";
    return noStore({ error: "bad_request", detail: msg }, 400);
  }

  const { holdKey, slotId, slotIds } = body;
  const now = new Date();

  if (holdKey) {
    await prisma.slot.updateMany({
      where: { holdKey, holdUntil: { gt: now } },
      data: { holdKey: null, holdUntil: null },
    });
    return noStore({ ok: true });
  }

  if (slotIds?.length) {
    await prisma.slot.updateMany({
      where: {
        id: { in: slotIds },
        OR: [{ holdUntil: { lt: now } }, { holdKey: null }],
      },
      data: { holdKey: null, holdUntil: null },
    });
    return noStore({ ok: true });
  }

  if (slotId) {
    await prisma.slot.updateMany({
      where: {
        id: slotId,
        OR: [{ holdUntil: { lt: now } }, { holdKey: null }],
      },
      data: { holdKey: null, holdUntil: null },
    });
    return noStore({ ok: true });
  }

  return noStore({ ok: true });
}
