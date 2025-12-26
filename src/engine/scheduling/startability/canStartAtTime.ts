import { prisma } from "@/lib/prisma";
import { getBlockIdsByTime } from "./getBlockIdsByTime";

export async function canStartAtTime(
  startTime: Date,
  liveMinutes: number,
  tx = prisma
) {
  const ids = await getBlockIdsByTime(startTime, liveMinutes, tx);
  return Array.isArray(ids) && ids.length > 0;
}
