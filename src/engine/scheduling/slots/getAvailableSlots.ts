import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";

import { guards } from "../policy/guards";
import { canStartAtTime } from "../startability/canStartAtTime";
import { SLOT_SIZE_MIN } from "../time/timeMath";

const MAX_RANGE_DAYS = 60;
const MIN_MINUTES = 30;
const MAX_MINUTES = 240;

type Params = {
  from: Date;
  to: Date;
  liveMinutes: number;
};

export async function getAvailableSlots(
  { from, to, liveMinutes }: Params,
  tx = prisma
) {
  // normalize liveMinutes
  let minutes = Math.round(liveMinutes / SLOT_SIZE_MIN) * SLOT_SIZE_MIN;
  if (minutes < MIN_MINUTES || minutes > MAX_MINUTES) return [];

  // cap requested range
  const days =
    (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
  if (days > MAX_RANGE_DAYS) return [];

  // engine-owned policy window
  const { minStart, maxStart } = guards(new Date());
  const gte = from < minStart ? minStart : from;
  const lt = to > maxStart ? maxStart : to;
  if (gte >= lt) return [];

  const now = new Date();

  // candidate slots: free + not actively held
  const rows = await tx.slot.findMany({
    where: {
      status: SlotStatus.free,
      startTime: { gte, lt },
      OR: [{ holdUntil: null }, { holdUntil: { lt: now } }],
    },
    select: { id: true, startTime: true },
    orderBy: { startTime: "asc" },
  });

  // safety cap
  if (rows.length > 2000) return [];

  // final validation: contiguous blocks, buffers, per-day cap
  const valid: { id: string; startTime: Date }[] = [];

  for (const r of rows) {
    if (await canStartAtTime(r.startTime, minutes, tx)) {
      valid.push(r);
    }
  }

  return valid;
}
