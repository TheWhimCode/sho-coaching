// src/app/api/holds/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";
import { SlotStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HOLD_TTL_MIN = 10;
const MAX_TTL_MIN = 15;
const TTL_MIN = Math.min(HOLD_TTL_MIN, MAX_TTL_MIN);

const PostZ = z.object({
  slotId: z.string().min(1).max(64),
  holdKey: z.string().min(1).max(128).optional(),
});

const DelZ = z.object({
  slotId: z.string().min(1).max(64),
  holdKey: z.string().min(1).max(128).optional(),
});

function noStore(json: unknown, status = 200): NextResponse {
  const res = NextResponse.json(json, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST(req: Request) {
  if (req.method !== "POST") return noStore({ error: "method_not_allowed" }, 405);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  // per-IP: 60/min for POST
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

  const { slotId } = body;
  const clientKey = body.holdKey || crypto.randomUUID();

  const now = new Date();
  const holdUntil = new Date(now.getTime() + TTL_MIN * 60_000);

  const updated = await prisma.slot.updateMany({
    where: {
      id: slotId,
      status: SlotStatus.free,
      OR: [
        { holdUntil: null },
        { holdUntil: { lt: now } },
        { AND: [{ holdKey: clientKey }, { holdUntil: { gt: now } }] },
      ],
    },
    data: { holdKey: clientKey, holdUntil },
  });

  if (updated.count === 0) {
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

  const { slotId, holdKey } = body;
  const now = new Date();

  await prisma.slot.updateMany({
    where: {
      id: slotId,
      OR: [{ holdUntil: { lt: now } }, ...(holdKey ? [{ holdKey }] : [])],
    },
    data: { holdKey: null, holdUntil: null },
  });

  return noStore({ ok: true });
}
