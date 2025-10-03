import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  id: z.string(),                // Session ID
  newStart: z.string().datetime(), // ISO string
  // optional: how many minutes the session lasts (used only for blocking window convenience)
  scheduledMinutes: z.number().int().positive().optional(),
});

function ymd(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function toHHMM(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  try {
    const { id, newStart, scheduledMinutes } = Body.parse(await req.json());

    // 1) Update the session start time
    const newStartDate = new Date(newStart);
    const session = await prisma.session.update({
      where: { id },
      data: { scheduledStart: newStartDate },
      select: { id: true, scheduledMinutes: true },
    });

    // 2) (Optional but recommended) Block slots in your calendar using the same logic
    //    as your exceptions route: block the window [newStart - 30m, newStart + duration + 30m]
    const dur = scheduledMinutes ?? session.scheduledMinutes ?? 60;
    const startWindow = new Date(newStartDate.getTime() - 30 * 60_000);
    const endWindow = new Date(newStartDate.getTime() + (dur + 30) * 60_000);

    // Block only FREE slots inside that window (same as your exceptions logic)
    await prisma.slot.updateMany({
      where: {
        startTime: { gte: startWindow, lt: endWindow },
        status: SlotStatus.free,
      },
      data: { status: SlotStatus.blocked },
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 400 });
  }
}
