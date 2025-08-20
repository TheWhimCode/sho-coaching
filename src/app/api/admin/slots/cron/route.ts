import { prisma } from "@/lib/prisma";
import { getDayAvailability } from "@/lib/booking/availability";
import { SLOT_SIZE_MIN } from "@/lib/booking/block";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const utcMidnight = (d = new Date()) => {
  const t = new Date(d);
  t.setUTCHours(0, 0, 0, 0);
  return t;
};

export async function GET(req: Request) {
  // Only allow Vercel Cron (Bearer CRON_SECRET)
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const today = utcMidnight();
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() + 14);

  // 1) delete all past slots (bookings survive via onDelete:SetNull)
  const del = await prisma.slot.deleteMany({
    where: { startTime: { lt: today } },
  });

  // 2) generate next 14 days from rules/exceptions
  let created = 0;
  for (let day = new Date(today); day < end; day.setUTCDate(day.getUTCDate() + 1)) {
    const avail = await getDayAvailability(day);
    if (!avail) continue;

    const batch: { startTime: Date; duration: number; isTaken: boolean; status?: string }[] = [];
    for (let m = avail.openMinute; m < avail.closeMinute; m += SLOT_SIZE_MIN) {
      const t = new Date(day);
      t.setUTCMinutes(m, 0, 0); // minutes since UTC midnight
      batch.push({ startTime: t, duration: SLOT_SIZE_MIN, isTaken: false, status: "free" });
    }
    if (batch.length) {
      const res = await prisma.slot.createMany({ data: batch, skipDuplicates: true });
      created += res.count;
    }
  }

  return Response.json({ ok: true, deleted: del.count, created });
}
