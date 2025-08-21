import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { SlotStatus } from "@prisma/client";

const Body = z.object({
  date: z.string(),              // "YYYY-MM-DD"
  open: z.string().optional(),   // "HH:MM"
  close: z.string().optional(),  // "HH:MM" or "24:00"
  blocked: z.boolean().default(false),
});

function hhmmToMinutes(hhmm?: string) {
  if (!hhmm) return undefined;
  if (hhmm === "24:00") return 24 * 60;
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function utcMidnightFromYMD(ymd: string) {
  const d = new Date(ymd);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function POST(req: Request) {
  try {
    const parsed = Body.parse(await req.json());

    // build exception row
    const day = utcMidnightFromYMD(parsed.date);
    const data = {
      date: day,                              // DateTime (not unique)
      blocked: parsed.blocked,
      openMinute: hhmmToMinutes(parsed.open),
      closeMinute: hhmmToMinutes(parsed.close),
    };

    // allow multiple exceptions per day -> create (NOT upsert)
    const ex = await prisma.availabilityException.create({ data });

    // Immediately reflect in slots (only affects that calendar day)
    const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    if (parsed.blocked) {
      await prisma.slot.updateMany({
        where: {
          startTime: { gte: day, lt: dayEnd },
          status: SlotStatus.free,
        },
        data: { status: SlotStatus.blocked },
      });
    } else {
      const startMin = data.openMinute ?? 0;
      const endMin = data.closeMinute ?? 24 * 60;
      const start = new Date(day.getTime() + startMin * 60_000);
      const end = new Date(day.getTime() + endMin * 60_000);

      await prisma.slot.updateMany({
        where: {
          startTime: { gte: start, lt: end },
          status: SlotStatus.free,
        },
        data: { status: SlotStatus.blocked },
      });
    }

    return NextResponse.json({ ok: true, ex });
  } catch (err: any) {
    console.error("POST /exceptions failed:", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 400 });
  }
}

export async function GET() {
  try {
    const exceptions = await prisma.availabilityException.findMany({
      orderBy: { date: "asc" },
    });
    return NextResponse.json(exceptions);
  } catch (err: any) {
    console.error("GET /exceptions failed:", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.availabilityException.delete({ where: { id } });

    // NOTE: We don't auto-"unblock" slots here because there may be other overlapping exceptions.
    // Recompute/cron will regenerate future free slots based on current exceptions.
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /exceptions failed:", err);
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 400 });
  }
}
