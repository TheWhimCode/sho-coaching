import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rateLimit";

import { holdSlots } from "@/engine/scheduling/holds/holdSlots";
import { releaseHold } from "@/engine/scheduling/holds/releaseHold";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ---------- schemas ---------- */

const PostZ = z.object({
  slotId: z.string().min(1).max(64),
  liveMinutes: z.coerce.number().int().min(30).max(240),
  holdKey: z.string().min(1).max(128).optional(),
});

const DelZ = z.object({
  holdKey: z.string().min(1).max(128).optional(),
  slotId: z.string().min(1).max(64).optional(),
  slotIds: z.array(z.string().min(1).max(64)).optional(),
});

/* ---------- helpers ---------- */

function noStore(json: unknown, status = 200): NextResponse {
  const res = NextResponse.json(json, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

function getIP(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/* ---------- POST: acquire / refresh hold ---------- */

export async function POST(req: Request) {
  const ip = getIP(req);
  if (!rateLimit(`holds:post:${ip}`, 60, 60_000)) {
    return noStore({ error: "rate_limited" }, 429);
  }

  let body: z.infer<typeof PostZ>;
  try {
    body = PostZ.parse(await req.json());
  } catch (e) {
    return noStore({ error: "bad_request" }, 400);
  }

  const result = await holdSlots(
    body.slotId,
    body.liveMinutes,
    { holdKey: body.holdKey }
  );

  if (!result) {
    return noStore({ error: "unavailable" }, 409);
  }

  return noStore({
    ok: true,
    holdKey: result.holdKey,
    holdUntil: result.holdUntil.toISOString(),
    slotIds: result.slotIds,
  });
}

/* ---------- DELETE: release hold ---------- */

export async function DELETE(req: Request) {
  const ip = getIP(req);
  if (!rateLimit(`holds:del:${ip}`, 60, 60_000)) {
    return noStore({ error: "rate_limited" }, 429);
  }

  let body: z.infer<typeof DelZ>;
  try {
    body = DelZ.parse(await req.json());
  } catch {
    return noStore({ error: "bad_request" }, 400);
  }

  await releaseHold(body);

  return noStore({ ok: true });
}
