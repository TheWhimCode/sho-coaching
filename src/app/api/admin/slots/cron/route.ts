import { prisma } from "@/lib/prisma";
import { getDayAvailability } from "@/lib/booking/availability";
import { SLOT_SIZE_MIN } from "@/lib/booking/block";

export const runtime = "nodejs";

export async function GET() {
  const now = new Date();

  // 1) Delete past slots (before today 00:00)
  const todayMidnight = new Date(now);
  todayMidnight.setHours(0, 0, 0, 0);
  await prisma.slot.deleteMany({ where: { startTime: { lt: todayMidnight } } });

  // 2) Generate next 14 days based on rules/exceptions
  const end = new Date(todayMidnight);
  end.setDate(end.getDate() + 14);

  let insertedCount = 0;

  for (let day = new Date(todayMidnight); day < end; day.setDate(day.getDate() + 1)) {
    const avail = await getDayAvailability(day);
    if (!avail) continue;

    // Build all missing 15-min slots for this day
    const data: { startTime: Date; duration: number; isTaken: boolean }[] = [];
    for (let m = avail.openMinute; m < avail.closeMinute; m += SLOT_SIZE_MIN) {
      const slotTime = new Date(day);
      slotTime.setMinutes(m, 0, 0);
      data.push({ startTime: slotTime, duration: SLOT_SIZE_MIN, isTaken: false });
    }

    if (data.length) {
      // rely on @@unique([startTime]) so duplicates are skipped
      const res = await prisma.slot.createMany({ data, skipDuplicates: true });
      insertedCount += res.count;
    }
  }

  return Response.json({ ok: true, insertedCount });
}
