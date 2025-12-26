import { prisma } from "@/lib/prisma";
import { findSlotById } from "../db/slotQueries";
import { getBlockIdsByTime } from "./getBlockIdsByTime";

export async function getBlockIds(
  slotId: string,
  liveMinutes: number,
  tx = prisma
) {
  const start = await findSlotById(slotId, tx);
  if (!start) return null;
  return getBlockIdsByTime(start.startTime, liveMinutes, tx);
}
