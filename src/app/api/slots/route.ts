import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guards, getBlockIds } from "@/lib/booking/block"; // ⬅ added getBlockIds

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  const liveMinutes = Number(searchParams.get("liveMinutes") || "60"); // ⬅ read liveMinutes

  if (!fromStr || !toStr) {
    return NextResponse.json({ error: "from/to required" }, { status: 400 });
  }

  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return NextResponse.json({ error: "invalid dates" }, { status: 400 });
  }

  // Enforce global guards (lead time / advance window / opening hours)
  const { minStart, maxStart, isWithinHours } = guards(new Date());

  // Clamp the requested window to allowed range
  const gte = from < minStart ? minStart : from;
  const lte = to > maxStart ? maxStart : to;

  // Base query: only untaken slots in range
  const rows = await prisma.slot.findMany({
    where: {
      isTaken: false,
      startTime: { gte, lte },
    },
    select: { id: true, startTime: true },
    orderBy: { startTime: "asc" },
  });

  // Step 1: respect opening hours
  const filtered = rows.filter(r => isWithinHours(new Date(r.startTime)));

  // Step 2: continuity + buffer check
  const valid: typeof filtered = [];
  for (const r of filtered) {
    // continuity: must cover liveMinutes worth of contiguous blocks
    const slotIds = await getBlockIds(r.id, liveMinutes, prisma);
    if (!slotIds?.length) continue;

    // buffer: block ±15min around the requested session
    const start = new Date(r.startTime);
    const bufferBefore = new Date(start.getTime() - 15 * 60_000);
    const bufferAfter = new Date(
      start.getTime() + (liveMinutes + 15) * 60_000
    );

    const overlap = await prisma.slot.findFirst({
      where: {
        isTaken: true,
        startTime: { gte: bufferBefore, lt: bufferAfter },
      },
    });
    if (overlap) continue;

    valid.push(r);
  }

  return NextResponse.json(valid);
}
