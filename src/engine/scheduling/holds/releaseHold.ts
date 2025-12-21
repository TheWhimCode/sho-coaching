import { prisma } from "@/lib/prisma";

export async function releaseHold(
  args: {
    holdKey?: string;
    slotId?: string;
    slotIds?: string[];
  },
  tx = prisma
) {
  const now = new Date();

  if (args.holdKey) {
    await tx.slot.updateMany({
      where: { holdKey: args.holdKey, holdUntil: { gt: now } },
      data: { holdKey: null, holdUntil: null },
    });
    return;
  }

  if (args.slotIds?.length) {
    await tx.slot.updateMany({
      where: {
        id: { in: args.slotIds },
        OR: [{ holdUntil: { lt: now } }, { holdKey: null }],
      },
      data: { holdKey: null, holdUntil: null },
    });
    return;
  }

  if (args.slotId) {
    await tx.slot.updateMany({
      where: {
        id: args.slotId,
        OR: [{ holdUntil: { lt: now } }, { holdKey: null }],
      },
      data: { holdKey: null, holdUntil: null },
    });
  }
}
