import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const Body = z.object({
  action: z.enum(["markTaken","markFree","delete"]),
  from: z.string(),      // ISO inclusive
  to: z.string(),        // ISO exclusive
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });
  const { action, from, to } = parsed.data;
  const where = { startTime: { gte: new Date(from), lt: new Date(to) } };

  if (action === "delete") {
    const r = await prisma.slot.deleteMany({ where });
    return Response.json({ deleted: r.count });
  }
  if (action === "markTaken") {
    const r = await prisma.slot.updateMany({ where, data: { isTaken: true } });
    return Response.json({ updated: r.count });
  }
  const r = await prisma.slot.updateMany({ where, data: { isTaken: false } });
  return Response.json({ updated: r.count });
}
