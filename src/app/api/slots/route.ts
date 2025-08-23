// app/api/slots/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guards, canStartAtTime } from "@/lib/booking/block";
import { SlotStatus } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const liveMinutes = Number(searchParams.get("liveMinutes") || "60");

  if (!fromStr || !toStr) {
    return NextResponse.json({ error: "from/to required" }, { status: 400 });
  }

  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "invalid dates" }, { status: 400 });
  }

  const { minStart, maxStart, isWithinHours } = guards(new Date());
  const gte = from < minStart ? minStart : from;
  const lte = to > maxStart ? maxStart : to;

  const now = new Date();

  // Only FREE slots in range; hide soft-held-by-others (holdUntil in the future)
  const rows = await prisma.slot.findMany({
    where: {
      status: SlotStatus.free,
      startTime: { gte, lt: lte },
      OR: [{ holdUntil: null }, { holdUntil: { lt: now } }],
    },
    select: { id: true, startTime: true, status: true },
    orderBy: { startTime: "asc" },
  });

  const filtered = rows.filter((r) => isWithinHours(new Date(r.startTime)));

  const checked = await Promise.all(
    filtered.map(async (r) =>
      (await canStartAtTime(r.startTime, liveMinutes, prisma)) ? r : null
    )
  );

  const valid = checked.filter(
    (x): x is typeof filtered[number] => Boolean(x)
  );

  return NextResponse.json(valid);
}
