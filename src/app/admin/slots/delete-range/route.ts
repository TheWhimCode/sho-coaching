import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";

const Body = z.object({
  date: z.string(),   // YYYY-MM-DD
  start: z.string(),  // "HH:MM"
  end: z.string(),    // "HH:MM"
});

function hhmmToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { date, start, end } = parsed.data;
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);

  const startMin = hhmmToMinutes(start);
  const endMin = hhmmToMinutes(end);

  const startDate = new Date(d.getTime() + startMin * 60_000);
  const endDate = new Date(d.getTime() + endMin * 60_000);
  const now = new Date();

  const res = await prisma.slot.deleteMany({
    where: {
      startTime: { gte: startDate, lt: endDate },
      status: { in: [SlotStatus.free, SlotStatus.blocked] },
      OR: [{ holdUntil: null }, { holdUntil: { lt: now } }],
    },
  });

  return NextResponse.json({ ok: true, deleted: res.count });
}
