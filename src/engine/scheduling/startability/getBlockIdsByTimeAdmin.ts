// src/engine/scheduling/getBlockIdsByTimeAdmin.ts
import type { PrismaClient } from "@prisma/client";

export async function getBlockIdsByTimeAdmin(
  start: Date,
  minutes: number,
  prisma: PrismaClient
): Promise<string[]> {
  const end = new Date(start.getTime() + minutes * 60 * 1000);

  const slots = await prisma.slot.findMany({
    where: {
      startTime: { gte: start, lt: end },
    },
    select: { id: true },
    orderBy: { startTime: "asc" },
  });

  return slots.map((s) => s.id);
}
