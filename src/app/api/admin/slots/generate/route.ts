import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const Body = z.object({
  from: z.string(),  // ISO inclusive
  to: z.string(),    // ISO exclusive
  openHour: z.number().int().min(0).max(23).default(13),
  closeHour: z.number().int().min(1).max(24).default(24),
  stepMin: z.number().int().min(5).max(60).default(15),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: "Invalid body" }, { status: 400 });

  const { from, to, openHour, closeHour, stepMin } = parsed.data;
  const start = new Date(from);
  const end = new Date(to);

  // 1) Read existing startTimes in range
  const existing = await prisma.slot.findMany({
    where: { startTime: { gte: start, lt: end } },
    select: { startTime: true },
  });
  const existingSet = new Set(existing.map(e => e.startTime.getTime()));

  // 2) Build only missing rows
  const data: { startTime: Date; duration: number; isTaken: boolean }[] = [];
  const day = new Date(start);
  day.setHours(0, 0, 0, 0);

  while (day < end) {
    for (let h = openHour; h < closeHour; h++) {
      for (let m = 0; m < 60; m += stepMin) {
        const t = new Date(day);
        t.setHours(h, m, 0, 0);
        if (!existingSet.has(t.getTime())) {
          data.push({ startTime: t, duration: stepMin, isTaken: false });
        }
      }
    }
    day.setDate(day.getDate() + 1);
  }

  // 3) Fast insert of new rows only
  const res = data.length
    ? await prisma.slot.createMany({ data })
    : { count: 0 };

  return Response.json({ ok: true, inserted: res.count, attempted: data.length });
}
