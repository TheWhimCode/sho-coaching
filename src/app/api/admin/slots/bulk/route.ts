import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";

export const runtime = "nodejs";

const Body = z.object({
  action: z.enum(["markTaken", "markFree", "delete"]),
  from: z.string(), // ISO inclusive
  to: z.string(),   // ISO exclusive
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });

  const { action, from, to } = parsed.data;
  const start = new Date(from);
  const end = new Date(to);
  const now = new Date();

  const inRange = { startTime: { gte: start, lt: end } };

  if (action === "delete") {
    // delete only future free/blocked and not actively held
    const r = await prisma.slot.deleteMany({
      where: {
        ...inRange,
        status: { in: [SlotStatus.free, SlotStatus.blocked] },
        OR: [{ holdUntil: null }, { holdUntil: { lt: now } }],
      },
    });
    return Response.json({ deleted: r.count });
  }

  if (action === "markTaken") {
    const r = await prisma.slot.updateMany({
      where: { ...inRange, status: { in: [SlotStatus.free, SlotStatus.blocked] } },
      data: { status: SlotStatus.taken, holdKey: null, holdUntil: null },
    });
    return Response.json({ updated: r.count });
  }

  // markFree
  const r = await prisma.slot.updateMany({
    where: { ...inRange, status: { in: [SlotStatus.free, SlotStatus.blocked] } },
    data: { status: SlotStatus.free, holdKey: null, holdUntil: null },
  });
  return Response.json({ updated: r.count });
}
