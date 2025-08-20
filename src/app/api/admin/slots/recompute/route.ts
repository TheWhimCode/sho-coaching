import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDayAvailability } from "@/lib/booking/availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Recompute slots for [today, today+14)
export async function POST() {
  const today = new Date();
  today.setHours(0,0,0,0);

  for (let i = 0; i < 14; i++) {
    const day = new Date(today);
    day.setDate(today.getDate() + i);

    const avail = await getDayAvailability(day);
    const midnight = new Date(day);
    midnight.setHours(0,0,0,0);

    const nextMidnight = new Date(midnight);
    nextMidnight.setDate(midnight.getDate() + 1);

    // Delete future untaken slots in that day
    await prisma.slot.deleteMany({
      where: {
        startTime: { gte: midnight, lt: nextMidnight },
        isTaken: false,
      },
    });

    if (!avail) continue;

    // Recreate slots for the available window
    const data = [];
    for (let m = avail.openMinute; m < avail.closeMinute; m += 15) {
      const start = new Date(midnight.getTime() + m * 60_000);
      data.push({ startTime: start, duration: 15, isTaken: false, status: "free" });
    }
    if (data.length) {
      await prisma.slot.createMany({ data, skipDuplicates: true });
    }
  }

  return NextResponse.json({ ok: true });
}
