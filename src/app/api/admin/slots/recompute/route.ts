import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDayAvailability } from "@/lib/booking/availability";
import { SLOT_SIZE_MIN } from "@/lib/booking/block";
import { SlotStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const utcMidnight = (d = new Date()) => {
  const t = new Date(d);
  t.setUTCHours(0, 0, 0, 0);
  return t;
};

export async function POST() {
  const today = utcMidnight();
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() + 15);
  const now = new Date();

  // 1) delete all past slots (any status)
  const delPast = await prisma.slot.deleteMany({
    where: { startTime: { lt: today } },
  });

  // 2) delete ONLY future FREE/BLOCKED that are not actively held
  const delFuture = await prisma.slot.deleteMany({
    where: {
      startTime: { gte: today },
      status: { in: [SlotStatus.free, SlotStatus.blocked] },
      OR: [{ holdUntil: null }, { holdUntil: { lt: now } }],
    },
  });

  // 3) regenerate future FREE slots
  let created = 0;
  for (let day = new Date(today); day < end; day.setUTCDate(day.getUTCDate() + 1)) {
    const intervals = await getDayAvailability(day);
    if (!intervals) continue;

    for (const { openMinute, closeMinute } of intervals) {
      const batch: { startTime: Date; duration: number; status: SlotStatus }[] = [];
      for (let m = openMinute; m < closeMinute; m += SLOT_SIZE_MIN) {
        const t = new Date(day);
        t.setUTCMinutes(m, 0, 0);
        batch.push({ startTime: t, duration: SLOT_SIZE_MIN, status: SlotStatus.free });
      }
      if (batch.length) {
        const res = await prisma.slot.createMany({ data: batch, skipDuplicates: true });
        created += res.count;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    deleted: delPast.count + delFuture.count,
    created,
  });
}
