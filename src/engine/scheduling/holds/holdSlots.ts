import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";
import crypto from "crypto";

import { getBlockIdsByTime } from "../startability/getBlockIdsByTime";
import { getHoldUntil } from "./policy";

export async function holdSlots(
  slotId: string,
  liveMinutes: number,
  opts?: { holdKey?: string },
  tx = prisma
) {
  const clientKey = opts?.holdKey || crypto.randomUUID();

  const start = await tx.slot.findUnique({
    where: { id: slotId },
    select: { startTime: true },
  });
  if (!start) return null;

  const blockIds = await getBlockIdsByTime(
    start.startTime,
    liveMinutes,
    tx,
    { holdKey: clientKey }
  );
  if (!blockIds) return null;

  const now = new Date();
  const holdUntil = getHoldUntil(now);

  const updated = await tx.slot.updateMany({
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

  if (updated.count !== blockIds.length) return null;

  return {
    holdKey: clientKey,
    holdUntil,
    slotIds: blockIds,
  };
}
