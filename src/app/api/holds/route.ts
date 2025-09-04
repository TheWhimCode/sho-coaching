// src/app/api/holds/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { SlotStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOLD_TTL_MIN = 10;           // requested TTL
const MAX_TTL_MIN = 15;            // safety cap
const TTL_MIN = Math.min(HOLD_TTL_MIN, MAX_TTL_MIN);

const PostZ = z.object({
  slotId: z.string().min(1).max(64),
  holdKey: z.string().min(1).max(128).optional(),
});

const DelZ = z.object({
  slotId: z.string().min(1).max(64),
  holdKey: z.string().min(1).max(128).optional(),
});

function noStore(json: any, status = 200) {
  const res = NextResponse.json(json, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(req: Request) {
  if (req.method !== "POST") return noStore({ error: "method_not_allowed" }, 405);

  // Per-IP rate limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`holds:post:${ip}`, 30, 60_000)) {
    return noStore({ error: "rate_limited" }, 429);
  }

  let body: z.infer<typeof PostZ>;
  try {
    body = PostZ.parse(await req.json());
  } catch (e: any) {
    return noStore({ error: "bad_request", detail: e?.message ?? "invalid body" }, 400);
  }

  const { slotId } = body;
  const clientKey = body.holdKey || crypto.randomUUID();

  const now = new Date();
  const holdUntil = new Date(now.getTime() + TTL_MIN * 60_000);

  // Only set/extend a hold if:
  // - slot is FREE, and not currently held, or the hold is expired, or the requester owns the hold
  const updated = await prisma.slot.updateMany({
    where: {
      id: slotId,
      status: SlotStatus.free,
      OR: [
        { holdUntil: null },
        { holdUntil: { lt: now } },
        { AND: [{ holdKey: clientKey }, { holdUntil: { gt: now } }] }, // allow extension by same owner
      ],
    },
    data: { holdKey: clientKey, holdUntil },
  });

  if (updated.count === 0) {
    // Don’t leak whether slot exists or who holds it
    return noStore({ error: "unavailable" }, 409);
  }

  return noStore({
    ok: true,
    holdKey: clientKey,
    holdUntil: holdUntil.toISOString(),
  });
}

export async function DELETE(req: Request) {
  if (req.method !== "DELETE") return noStore({ error: "method_not_allowed" }, 405);

  // Per-IP rate limit
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`holds:del:${ip}`, 60, 60_000)) {
    return noStore({ error: "rate_limited" }, 429);
  }

  let body: z.infer<typeof DelZ>;
  try {
    body = DelZ.parse(await req.json());
  } catch (e: any) {
    return noStore({ error: "bad_request", detail: e?.message ?? "invalid body" }, 400);
  }

  const { slotId, holdKey } = body;
  const now = new Date();

  // Release if:
  // - requester provides the same holdKey, OR
  // - hold is already expired
  await prisma.slot.updateMany({
    where: {
      id: slotId,
      OR: [{ holdUntil: { lt: now } }, ...(holdKey ? [{ holdKey }] : [])],
    },
    data: { holdKey: null, holdUntil: null },
  });

  return noStore({ ok: true });
}
